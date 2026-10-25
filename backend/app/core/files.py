"""Validación compartida de adjuntos. Los bytes y nombres no se escriben en logs."""
from pathlib import Path
from fastapi import HTTPException

MAX_FILE_BYTES = 5 * 1024 * 1024


def validated_upload(file, allowed=("application/pdf", "image/jpeg", "image/png")):
    content = file.file.read(MAX_FILE_BYTES + 1)
    if not content or len(content) > MAX_FILE_BYTES:
        raise HTTPException(422, "Adjunta un archivo de entre 1 byte y 5 MB.")
    suffix = Path(file.filename or "").suffix.lower()
    candidates = [
        (suffix == ".pdf" and content.startswith(b"%PDF-"), "application/pdf", ".pdf"),
        (suffix in (".jpg", ".jpeg") and content.startswith(b"\xff\xd8\xff"), "image/jpeg", ".jpg"),
        (suffix == ".png" and content.startswith(b"\x89PNG\r\n\x1a\n"), "image/png", ".png"),
    ]
    match = next(((mime, extension) for valid, mime, extension in candidates if valid and mime in allowed), None)
    if not match:
        raise HTTPException(422, "El contenido debe coincidir con un formato permitido: PDF, JPG o PNG.")
    name = (file.filename or "documento").replace("\\", "/").split("/")[-1]
    if len(name) > 200 or any(ord(c) < 32 for c in name):
        raise HTTPException(422, "El nombre del archivo no es válido o supera 200 caracteres.")
    return content, match[0], match[1], name
