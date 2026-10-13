"""Google OIDC code flow, bound to browser, with PKCE and one-use state.

Google proves identity. Existing users/roles and the HttpOnly session remain ours.
"""

import base64
import hashlib
import os
import secrets
import time
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import select, delete
from sqlalchemy.orm import Session as DBSession
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from google.auth.exceptions import GoogleAuthError

from .database import get_db
from .identity import DOMAIN, safe_next, validate_google_claims
from .models import OAuthAttempt, User, AccountEvent
from .security import ORIGIN, PRODUCTION, digest, rate_limit
from .sessions import establish_session

router = APIRouter(prefix="/api/v1/auth", tags=["Identidad"])
COOKIE = "oauth_browser"
COOKIE_PATH = "/api/v1/auth/google"


def configuration():
    return os.getenv("GOOGLE_CLIENT_ID", ""), os.getenv("GOOGLE_CLIENT_SECRET", "")


def redirect_uri():
    return f"{ORIGIN}/api/v1/auth/google/callback"


@router.get("/options")
def options():
    client_id, secret = configuration()
    return {
        "google_enabled": bool(client_id and secret),
        "institutional_domain": DOMAIN,
        "phone_enabled": True,
    }


@router.get("/google/start")
def start(request: Request, next: str = "/", db: DBSession = Depends(get_db)):
    rate_limit(request, "google-start")
    client_id, secret = configuration()
    if not client_id or not secret:
        raise HTTPException(
            503, "Google está pendiente de configuración institucional."
        )
    state, browser, nonce = (secrets.token_hex(32) for _ in range(3))
    verifier = secrets.token_urlsafe(48)
    challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest())
        .rstrip(b"=")
        .decode()
    )
    db.execute(delete(OAuthAttempt).where(OAuthAttempt.expires < int(time.time())))
    db.add(
        OAuthAttempt(
            state_hash=digest(state),
            browser_hash=digest(browser),
            nonce=nonce,
            verifier=verifier,
            next_path=safe_next(next),
            expires=int(time.time()) + 300,
        )
    )
    db.commit()
    query = urlencode(
        {
            "client_id": client_id,
            "redirect_uri": redirect_uri(),
            "response_type": "code",
            "scope": "openid email",
            "hd": DOMAIN,
            "state": state,
            "nonce": nonce,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "prompt": "select_account",
        }
    )
    response = RedirectResponse(
        "https://accounts.google.com/o/oauth2/v2/auth?" + query, status_code=303
    )
    # Temporary Lax cookie is needed for Google's top-level GET callback. The app session stays Strict.
    response.set_cookie(
        COOKIE,
        browser,
        httponly=True,
        secure=PRODUCTION,
        samesite="lax",
        max_age=300,
        path=COOKIE_PATH,
    )
    return response


def exchange_and_verify(code, verifier, client_id, secret):
    with httpx.Client(timeout=10, follow_redirects=False) as client:
        response = client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": secret,
                "redirect_uri": redirect_uri(),
                "grant_type": "authorization_code",
                "code_verifier": verifier,
            },
        )
        response.raise_for_status()
        token = response.json().get("id_token")
    if not token:
        raise ValueError("No ID token.")

    def certificate_request(*args, **kwargs):
        kwargs["timeout"] = 10
        return google_requests.Request()(*args, **kwargs)

    # Google's library checks signature, audience, issuer and expiry. Never decode without verification.
    return id_token.verify_oauth2_token(token, certificate_request, audience=client_id)


def failure(code):
    response = RedirectResponse(f"{ORIGIN}/acceso?oauth_error={code}", status_code=303)
    response.delete_cookie(COOKIE, path=COOKIE_PATH)
    return response


@router.get("/google/callback")
def callback(
    request: Request,
    state: str = "",
    code: str = "",
    error: str = "",
    db: DBSession = Depends(get_db),
):
    rate_limit(request, "google-callback")
    if len(state) != 64 or len(code) > 4096:
        return failure("expired")
    attempt = db.scalar(
        select(OAuthAttempt)
        .where(OAuthAttempt.state_hash == digest(state))
        .with_for_update()
    )
    browser = request.cookies.get(COOKIE, "")
    if (
        not attempt
        or attempt.expires < time.time()
        or not secrets.compare_digest(attempt.browser_hash, digest(browser))
    ):
        return failure("expired")
    nonce, verifier, next_path = attempt.nonce, attempt.verifier, attempt.next_path
    db.delete(attempt)
    db.commit()  # consume before the network call; retries need a fresh login attempt
    if error or not code:
        return failure("cancelled")
    client_id, secret = configuration()
    if not client_id or not secret:
        return failure("unavailable")
    try:
        claims = exchange_and_verify(code, verifier, client_id, secret)
        email, sub = validate_google_claims(claims, nonce)
    except (HTTPException, ValueError, GoogleAuthError, httpx.HTTPError):
        return failure("denied")
    user = db.scalar(select(User).where(User.google_sub == sub).with_for_update())
    if user and user.email != email:
        return failure("denied")
    if not user:
        user = db.scalar(select(User).where(User.email == email).with_for_update())
    if not user or (user.google_sub and user.google_sub != sub):
        return failure("denied")
    if not user.google_sub:
        user.google_sub = sub
        db.add(
            AccountEvent(
                user_id=user.id,
                actor_id=user.id,
                action="Identidad de Google institucional vinculada",
            )
        )
    response = RedirectResponse(ORIGIN + next_path, status_code=303)
    response.delete_cookie(COOKIE, path=COOKIE_PATH)
    establish_session(db, response, user, "Acceso con Google institucional")
    return response
