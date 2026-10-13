DOCUMENTS = [
    {"id": "acta", "name": "Acta de nacimiento", "area": "escolares", "required": True},
    {"id": "curp", "name": "Constancia de CURP", "area": "escolares", "required": True},
    {
        "id": "certificado",
        "name": "Certificado de estudios",
        "area": "escolares",
        "required": True,
    },
    {
        "id": "servicio",
        "name": "Liberación de servicio social",
        "area": "escolares",
        "required": True,
    },
    {
        "id": "noadeudo",
        "name": "Constancia de no adeudo",
        "area": "escolares",
        "required": True,
    },
    {
        "id": "pago",
        "name": "Comprobante de pago",
        "area": "tesoreria",
        "required": True,
    },
    {
        "id": "titulacion",
        "name": "Documento de titulación",
        "area": "escolares",
        "required": True,
    },
    {"id": "foto", "name": "Fotografía", "area": "escolares", "required": False},
]
STATES = {
    "borrador": "Borrador",
    "enviada": "Solicitud enviada",
    "revision": "En revisión",
    "incompleta": "Documentación incompleta",
    "rechazada": "Documentación rechazada",
    "validada": "Documentación validada",
    "proceso": "En proceso de titulación",
    "tramite": "Título en trámite",
    "disponible": "Título disponible",
    "concluido": "Trámite concluido",
    "cancelado": "Cancelado",
}
TRANSITIONS = {
    "borrador": ["enviada", "cancelado"],
    "enviada": ["revision", "cancelado"],
    "revision": ["incompleta", "rechazada", "validada", "cancelado"],
    "incompleta": ["enviada", "cancelado"],
    "rechazada": ["enviada", "cancelado"],
    "validada": ["proceso", "cancelado"],
    "proceso": ["tramite", "cancelado"],
    "tramite": ["disponible", "cancelado"],
    "disponible": ["concluido"],
    "concluido": [],
    "cancelado": [],
}
EDITABLE = ["borrador", "incompleta", "rechazada"]


def can_review(role, kind):
    doc = next((d for d in DOCUMENTS if d["id"] == kind), None)
    return bool(
        doc
        and (
            role == doc["area"]
            or (role == "administrador" and doc["area"] == "escolares")
        )
    )


def missing_documents(docs, validated=False):
    return [
        d["name"]
        for d in DOCUMENTS
        if d["required"]
        and not any(
            x.kind == d["id"]
            and (x.status == "validado" if validated else x.status != "rechazado")
            for x in docs
        )
    ]
