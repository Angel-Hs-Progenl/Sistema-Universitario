"""Política de identidad compartida. El perfil académico no vincula credenciales."""

import re
from fastapi import HTTPException

DOMAIN = "utdeoriental.edu.mx"


def institutional_email(value):
    return isinstance(value, str) and bool(
        re.fullmatch(r"[a-z0-9._+\-]+@utdeoriental\.edu\.mx", value.strip().lower())
    )


def normalize_phone(value):
    text = value.strip()
    if not re.fullmatch(r"\+?[0-9 ()\-]+", text):
        raise ValueError("Teléfono inválido.")
    digits = re.sub(r"\D", "", text)
    if not text.startswith("+") and len(digits) == 10:
        return "+52" + digits
    if text.startswith("+") and 8 <= len(digits) <= 15 and digits[0] != "0":
        return "+" + digits
    raise ValueError(
        "Usa 10 dígitos de México o un número internacional con + y código de país."
    )


def validate_google_claims(claims, nonce):
    import secrets

    if (
        claims.get("hd") != DOMAIN
        or claims.get("email_verified") is not True
        or not institutional_email(claims.get("email", ""))
        or not isinstance(claims.get("sub"), str)
        or not 1 <= len(claims["sub"]) <= 255
        or not secrets.compare_digest(
            str(claims.get("nonce", "")).encode(), nonce.encode()
        )
    ):
        raise HTTPException(403, "Usa una cuenta institucional autorizada.")
    return claims["email"].lower(), claims["sub"]


def safe_next(value):
    return (
        value
        if re.fullmatch(
            r"/(?:titulacion(?:/[a-zA-Z0-9/\-]+)?|becas(?:/[a-zA-Z0-9/\-]+)?|notificaciones|cuenta|ayuda)?",
            value or "",
        )
        else "/"
    )
