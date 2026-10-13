"""Identidades ficticias. Ninguna prueba contacta Google ni envía SMS."""

import base64
import hashlib
import json
import time
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, func
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from google.auth import jwt, crypt

from app.main import app
from app.core import google_oauth, auth
from app.core.database import SessionLocal
from app.core.identity import normalize_phone
from app.core.models import User, OAuthAttempt, AccountEvent
from app.core.security import digest
from conftest import PASSWORD, PROFILE


def test_database_error_does_not_log_sensitive_details(clients, monkeypatch, caplog):
    from sqlalchemy.exc import SQLAlchemyError

    private_value = "PRIVATE-SYNTHETIC-PAYLOAD"

    def broken(*args, **kwargs):
        raise SQLAlchemyError(private_value)

    monkeypatch.setattr(auth, "establish_session", broken)
    response = clients["estudiante"].post(
        "/api/v1/auth/login",
        json={"email": "estudiante@test.local", "password": PASSWORD},
    )
    assert response.status_code == 503
    assert private_value not in response.text + caplog.text


def test_phone_link_operator_authorization_audit_and_session_revocation(
    clients, monkeypatch
):
    import manage

    monkeypatch.setattr(manage.getpass, "getpass", lambda prompt: PASSWORD)
    args = SimpleNamespace(
        actor="escolares@test.local",
        email="estudiante@test.local",
        phone="+12025550100",
    )
    with pytest.raises(SystemExit, match="Operador no autorizado"):
        manage.link_phone(args)
    args.actor = "administrador@test.local"
    manage.link_phone(args)
    assert clients["estudiante"].get("/api/v1/auth/me").status_code == 401
    assert clients["escolares"].get("/api/v1/auth/me").status_code == 200
    with SessionLocal() as db:
        event = db.scalar(
            select(AccountEvent).where(
                AccountEvent.action == "Teléfono de acceso vinculado por operador"
            )
        )
        assert db.get(User, event.actor_id).role == "administrador"
    args.email = "otro@test.local"
    with pytest.raises(SystemExit, match="ya pertenece a otra cuenta"):
        manage.link_phone(args)
    # Duplicate binding rolls back the entire transaction, including session revocation.
    assert clients["otro"].get("/api/v1/auth/me").status_code == 200
    with SessionLocal() as db:
        assert (
            db.scalar(select(User).where(User.email == "otro@test.local")).login_phone
            is None
        )


def test_phone_requires_explicit_link_not_profile_contact(clients):
    student = clients["estudiante"]
    assert (
        student.put(
            "/api/v1/profile", json={**PROFILE, "telefono": "2025550100"}
        ).status_code
        == 200
    )
    with TestClient(app) as login:
        assert (
            login.post(
                "/api/v1/auth/login",
                json={"identifier": "2025550100", "password": PASSWORD},
            ).status_code
            == 401
        )
        with SessionLocal() as db:
            user = db.scalar(select(User).where(User.email == "estudiante@test.local"))
            user.login_phone = "+12025550100"
            db.commit()
        bad = login.post(
            "/api/v1/auth/login",
            json={"identifier": "+1 (202) 555-0100", "password": "incorrecta"},
        )
        assert bad.status_code == 401
        result = login.post(
            "/api/v1/auth/login",
            json={"identifier": "+1 (202) 555-0100", "password": PASSWORD},
        )
        assert result.status_code == 200
        assert result.json()["user"]["role"] == "estudiante"
        assert (
            "HttpOnly" in result.headers["set-cookie"]
            and "SameSite=strict" in result.headers["set-cookie"]
        )
        assert login.get("/api/v1/auth/me").status_code == 200


def test_phone_normalization_and_production_domain_gate(clients, monkeypatch):
    assert normalize_phone("222 000 0000") == "+522220000000"
    for invalid in ["", "123", "+0123456789", "phone", "1" * 20]:
        with pytest.raises(ValueError):
            normalize_phone(invalid)
    monkeypatch.setattr(auth, "PRODUCTION", True)
    with TestClient(app) as client:
        assert (
            client.post(
                "/api/v1/auth/login",
                json={"email": "estudiante@test.local", "password": PASSWORD},
            ).status_code
            == 401
        )


def test_account_preferences_do_not_change_identity_or_roles(clients):
    client = clients["escolares"]
    assert (
        client.put(
            "/api/v1/account",
            json={"display_name": "Equipo de prueba", "role": "administrador"},
        ).status_code
        == 422
    )
    assert (
        client.put("/api/v1/account", json={"display_name": "   "}).status_code == 422
    )
    assert (
        client.put(
            "/api/v1/account",
            json={"display_name": "Equipo de prueba"},
            headers={"X-CSRF-Token": "incorrecto"},
        ).status_code
        == 403
    )
    result = client.put("/api/v1/account", json={"display_name": "Equipo de prueba"})
    assert result.status_code == 200
    assert result.json()["display_name"] == "Equipo de prueba"
    assert result.json()["name"] == "escolares"
    assert result.json()["role"] == "escolares"
    with SessionLocal() as db:
        event = db.scalar(
            select(AccountEvent).where(
                AccountEvent.action == "Nombre visible actualizado"
            )
        )
        assert event.actor_id == event.user_id


@pytest.fixture
def google_settings(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-no-real")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret-no-real")


def start_google(client, next_path="/titulacion/documentos"):
    response = client.get(
        "/api/v1/auth/google/start", params={"next": next_path}, follow_redirects=False
    )
    assert response.status_code == 303
    assert response.headers["location"].startswith("https://accounts.google.com/")
    query = {
        k: v[0]
        for k, v in parse_qs(urlparse(response.headers["location"]).query).items()
    }
    assert (
        query["hd"] == "utdeoriental.edu.mx"
        and query["code_challenge_method"] == "S256"
    )
    with SessionLocal() as db:
        attempt = db.get(OAuthAttempt, digest(query["state"]))
        assert (
            base64.urlsafe_b64encode(hashlib.sha256(attempt.verifier.encode()).digest())
            .rstrip(b"=")
            .decode()
            == query["code_challenge"]
        )
    return query


def claims(query):
    return {
        "email": "prueba-no-real@utdeoriental.edu.mx",
        "sub": "test-sub-no-real",
        "hd": "utdeoriental.edu.mx",
        "email_verified": True,
        "nonce": query["nonce"],
    }


def test_google_not_configured_is_explicit(monkeypatch):
    monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
    monkeypatch.delenv("GOOGLE_CLIENT_SECRET", raising=False)
    with TestClient(app) as client:
        assert client.get("/api/v1/auth/options").json()["google_enabled"] is False
        assert (
            client.get("/api/v1/auth/google/start", follow_redirects=False).status_code
            == 503
        )


def test_google_state_is_bound_to_browser_expires_and_cannot_redirect_outside(
    google_settings,
):
    with TestClient(app) as client, TestClient(app) as other:
        query = start_google(client, "//external.example")
        with SessionLocal() as db:
            attempt = db.get(OAuthAttempt, digest(query["state"]))
            assert attempt.next_path == "/"
        params = {"state": query["state"], "code": "local-test-code"}
        stolen = other.get(
            "/api/v1/auth/google/callback", params=params, follow_redirects=False
        )
        assert stolen.headers["location"].endswith("oauth_error=expired")
        assert other.get("/api/v1/auth/me").status_code == 401
        with SessionLocal() as db:
            db.get(OAuthAttempt, digest(query["state"])).expires = int(time.time()) - 1
            db.commit()
        assert (
            client.get(
                "/api/v1/auth/google/callback", params=params, follow_redirects=False
            )
            .headers["location"]
            .endswith("oauth_error=expired")
        )


@pytest.mark.parametrize(
    "change",
    [
        {"hd": "gmail.com"},
        {"email": "prueba-no-real@gmail.com"},
        {"email": "prueba@utdeoriental.edu.mx.external.example"},
        {"email_verified": False},
        {"nonce": "nonce-ajeno"},
        {"nonce": "á"},
        {"sub": ""},
        {"email": None},
    ],
)
def test_google_rejects_foreign_or_unverified_claims(
    google_settings, monkeypatch, change
):
    with TestClient(app) as client:
        query = start_google(client)
        monkeypatch.setattr(
            google_oauth,
            "exchange_and_verify",
            lambda *args: {**claims(query), **change},
        )
        response = client.get(
            "/api/v1/auth/google/callback",
            params={"state": query["state"], "code": "test-code"},
            follow_redirects=False,
        )
        assert response.headers["location"].endswith("oauth_error=denied")
        assert client.get("/api/v1/auth/me").status_code == 401
        with SessionLocal() as db:
            assert db.scalar(select(func.count()).select_from(User)) == 0


def test_google_preprovisioned_role_preserved_and_state_one_use(
    google_settings, monkeypatch, password_hash
):
    with SessionLocal() as db:
        user = User(
            email="prueba-no-real@utdeoriental.edu.mx",
            name="Cuenta ficticia",
            role="tesoreria",
            password=password_hash,
        )
        db.add(user)
        db.commit()
    with TestClient(app) as client:
        query = start_google(client)
        monkeypatch.setattr(
            google_oauth,
            "exchange_and_verify",
            lambda *args: {**claims(query), "role": "administrador"},
        )
        params = {"state": query["state"], "code": "test-code"}
        response = client.get(
            "/api/v1/auth/google/callback", params=params, follow_redirects=False
        )
        assert response.headers["location"].endswith("/titulacion/documentos")
        assert "HttpOnly" in response.headers["set-cookie"]
        assert client.get("/api/v1/auth/me").json()["user"]["role"] == "tesoreria"
        assert (
            client.get(
                "/api/v1/auth/google/callback", params=params, follow_redirects=False
            )
            .headers["location"]
            .endswith("oauth_error=expired")
        )


def test_google_does_not_auto_create_or_rebind_existing_identity(
    google_settings, monkeypatch, password_hash
):
    with TestClient(app) as client:
        query = start_google(client)
        monkeypatch.setattr(
            google_oauth, "exchange_and_verify", lambda *args: claims(query)
        )
        params = {"state": query["state"], "code": "test-code"}
        assert (
            client.get(
                "/api/v1/auth/google/callback", params=params, follow_redirects=False
            )
            .headers["location"]
            .endswith("oauth_error=denied")
        )
        with SessionLocal() as db:
            db.add(
                User(
                    email=claims(query)["email"],
                    name="Cuenta ficticia",
                    role="estudiante",
                    password=password_hash,
                    google_sub="other-test-sub",
                )
            )
            db.commit()
        query = start_google(client)
        params["state"] = query["state"]
        assert (
            client.get(
                "/api/v1/auth/google/callback", params=params, follow_redirects=False
            )
            .headers["location"]
            .endswith("oauth_error=denied")
        )


@pytest.fixture(scope="module")
def signing_identity():
    # Ephemeral key/certificate exist only in memory; no private keys are committed.
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "local-tests-only")])
    certificate = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.now(timezone.utc) - timedelta(minutes=1))
        .not_valid_after(datetime.now(timezone.utc) + timedelta(hours=1))
        .sign(key, hashes.SHA256())
    )
    private = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    return crypt.RSASigner.from_string(
        private, key_id="local-test-key"
    ), certificate.public_bytes(serialization.Encoding.PEM).decode()


@pytest.mark.parametrize("invalid", [None, "audience", "issuer", "expiry", "signature"])
def test_google_library_checks_signature_audience_issuer_and_expiry(
    signing_identity, monkeypatch, invalid
):
    signer, cert = signing_identity
    payload = {
        "iss": "https://accounts.google.com",
        "aud": "local-test-client",
        "iat": int(time.time()),
        "exp": int(time.time()) + 120,
        "sub": "local-test-sub",
    }
    if invalid == "audience":
        payload["aud"] = "foreign-client"
    if invalid == "issuer":
        payload["iss"] = "https://invalid.example"
    if invalid == "expiry":
        payload.update(iat=int(time.time()) - 200, exp=int(time.time()) - 100)
    token = jwt.encode(signer, payload).decode()
    if invalid == "signature":
        parts = token.split(".")
        parts[2] = ("A" if parts[2][0] != "A" else "B") + parts[2][1:]
        token = ".".join(parts)
    original_client = httpx.Client

    def exchange(request):
        assert request.url == "https://oauth2.googleapis.com/token"
        assert b"code_verifier=local-test-verifier" in request.content
        return httpx.Response(200, json={"id_token": token})

    monkeypatch.setattr(
        google_oauth.httpx,
        "Client",
        lambda **kwargs: original_client(
            transport=httpx.MockTransport(exchange), **kwargs
        ),
    )

    def certificate_transport(*args, **kwargs):
        assert kwargs["timeout"] == 10
        return SimpleNamespace(
            status=200, data=json.dumps({"local-test-key": cert}).encode()
        )

    monkeypatch.setattr(
        google_oauth.google_requests, "Request", lambda: certificate_transport
    )
    if invalid:
        with pytest.raises((ValueError, google_oauth.GoogleAuthError)):
            google_oauth.exchange_and_verify(
                "local-test-code",
                "local-test-verifier",
                "local-test-client",
                "local-test-secret",
            )
    else:
        assert (
            google_oauth.exchange_and_verify(
                "local-test-code",
                "local-test-verifier",
                "local-test-client",
                "local-test-secret",
            )["sub"]
            == "local-test-sub"
        )
