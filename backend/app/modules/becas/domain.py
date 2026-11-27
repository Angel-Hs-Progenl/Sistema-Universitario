"""Dominio y reglas de negocio del módulo de becas UTO."""

CARRERAS_UTO = [
    "Agricultura Sustentable y Protegida",
    "Cadena de Suministro",
    "Clasificación Arancelaria y Despacho Aduanero",
    "Desarrollo de Software Multiplataforma",
    "Mercadotecnia",
    "Mantenimiento Industrial",
    "Sistemas Automotrices",
    "Tecnología de Alimentos",
    "Desarrollo y Gestión de Software",
    "Diseño y Gestión de Redes Logísticas",
    "Enfermería",
    "Innovación de Negocios y Mercadotecnia",
    "Logística Comercial Global",
    "Procesos Alimentarios",
]

NIVELES_ESTUDIO = [
    "Técnico Superior Universitario",
    "Licenciatura / Ingeniería",
]

CUATRIMESTRES_DEFAULT = ["3°", "5°", "6°", "9°"]

SISTEMAS_ESTUDIO = [
    {"id": "presencial", "name": "Presencial"},
    {"id": "mixto", "name": "Mixto (Híbrido)"},
]

MODALIDADES = [
    {"id": "academica", "name": "Beca Académica"},
    {"id": "escasos_recursos", "name": "Beca Escasos Recursos Económicos"},
    {"id": "alimenticia", "name": "Beca Alimenticia"},
    {"id": "hijos_personal", "name": "Beca Hijas e Hijos del Personal de la Universidad"},
]

ESTADOS = {
    "recibida": "Solicitud recibida",
    "revision": "En revisión por comité",
    "aprobada": "Beca aprobada",
    "rechazada": "Solicitud rechazada",
    "renovada": "Beca renovada",
}

DOCUMENTOS = [
    {
        "id": "no_adeudo",
        "name": "Constancia de No Adeudo emitida por Tesorería",
        "required": True,
        "formats": ["application/pdf"],
        "max_size_mb": 1,
    },
    {
        "id": "kardex",
        "name": "Kárdex o constancia de calificaciones",
        "required": False,
        "formats": ["application/pdf"],
        "max_size_mb": 10,
    },
    {
        "id": "anexo1_protesta",
        "name": "Anexo 1 - Carta bajo protesta de decir verdad (Firma tinta azul)",
        "required": False,
        "formats": ["application/pdf"],
        "max_size_mb": 10,
    },
    {
        "id": "comprobante_ingresos",
        "name": "Comprobante de ingresos mensual (Nómina o constancia laboral)",
        "required": False,
        "formats": ["application/pdf"],
        "max_size_mb": 10,
    },
    {
        "id": "constancia_laboral_coordinador",
        "name": "Constancia laboral entregada a Coordinador (Sistema Mixto/Híbrido)",
        "required": False,
        "formats": ["application/pdf"],
        "max_size_mb": 10,
    },
    {
        "id": "valoracion_medica",
        "name": "Valoración médica emitida por el área de Enfermería UTO",
        "required": False,
        "formats": ["application/pdf"],
        "max_size_mb": 10,
    },
    {
        "id": "acta_nacimiento",
        "name": "Acta de nacimiento del estudiante",
        "required": False,
        "formats": ["application/pdf"],
        "max_size_mb": 10,
    },
    {
        "id": "constancia_laboral_rh",
        "name": "Constancia laboral emitida por Recursos Humanos UTO",
        "required": False,
        "formats": ["application/pdf"],
        "max_size_mb": 10,
    },
    {
        "id": "constancia_discapacidad",
        "name": "Certificado médico de discapacidad emitido por DIF o Salud Pública",
        "required": False,
        "formats": ["application/pdf"],
        "max_size_mb": 10,
    },
    {
        "id": "constancia_indigena",
        "name": "Constancia oficial de pueblo originario o comunidad indígena",
        "required": False,
        "formats": ["application/pdf"],
        "max_size_mb": 10,
    },
]

ESTADOS_ORDEN = {
    "programada": "Programada",
    "emitida": "Orden emitida",
    "pagada": "Pago verificado manualmente",
    "dispersada": "Dispersión externa registrada",
    "cancelada": "Anulada",
}


def calculate_vulnerability_score(
    monthly_income: float,
    monthly_expenses: float,
    dependents_count: int,
    housing_type: str = "propia",
) -> float:
    """Calcula un puntaje de vulnerabilidad socioeconómica (10 - 100)."""
    dep = max(1, dependents_count)
    per_capita = monthly_income / dep
    score = 50.0

    if per_capita <= 2000:
        score += 30.0
    elif per_capita <= 3500:
        score += 20.0
    elif per_capita <= 5000:
        score += 10.0
    else:
        score -= 10.0

    if housing_type in ("rentada", "prestada"):
        score += 10.0
    elif housing_type == "propia_pagando":
        score += 5.0

    if monthly_expenses > monthly_income:
        score += 10.0

    return max(10.0, min(100.0, score))


def evaluate_applicant_rules(
    applicant_gpa: float,
    call_min_gpa: float,
    vulnerability_score: float = 50.0,
    socioeconomic_required: bool = False,
    is_vulnerable: bool = False,
) -> dict:
    """Evalúa reglas de elegibilidad según criterios de la convocatoria."""
    issues = []
    if applicant_gpa < call_min_gpa:
        issues.append(f"El promedio registrado ({applicant_gpa:.2f}) no alcanza el mínimo autorizado de {call_min_gpa:.2f}.")

    if socioeconomic_required and vulnerability_score < 40.0 and not is_vulnerable:
        issues.append("El puntaje socioeconómico no cumple con el umbral prioritario de vulnerabilidad.")

    meets = len(issues) == 0
    return {
        "meets_requirements": meets,
        "issues": issues,
        "evaluated_gpa": applicant_gpa,
        "min_gpa": call_min_gpa,
        "vulnerability_score": vulnerability_score,
    }


VALIDATION_ESTADOS = {
    "pendiente": "Pendiente de validación",
    "validado": "Validado por Trabajo Social",
    "observado": "Con observaciones",
}

RENEWAL_ESTADOS = {
    "solicitada": "Solicitud de renovación",
    "aprobada_renovacion": "Renovación aprobada",
    "rechazada_renovacion": "Renovación rechazada",
}

BANCOS_MEXICO = [
    {"id": "002", "name": "BBVA"},
    {"id": "012", "name": "BBVA Bancomer"},
    {"id": "014", "name": "Santander"},
    {"id": "021", "name": "HSBC"},
    {"id": "036", "name": "Banorte"},
    {"id": "058", "name": "Banregio"},
    {"id": "072", "name": "Bancomext"},
    {"id": "127", "name": "Azteca"},
    {"id": "646", "name": "STP"},
]


def validate_clabe(clabe: str) -> dict:
    """Validates a Mexican CLABE interbank key (18 digits with check digit)."""
    if not clabe or not clabe.isdigit() or len(clabe) != 18:
        return {"valid": False, "error": "La CLABE debe tener exactamente 18 dígitos numéricos."}
    weights = [3, 7, 1] * 5 + [3, 7]
    check_sum = sum((int(d) * w) % 10 for d, w in zip(clabe[:17], weights))
    expected_digit = (10 - (check_sum % 10)) % 10
    if int(clabe[17]) != expected_digit:
        return {"valid": False, "error": "El dígito verificador de la CLABE no es correcto."}
    bank_code = clabe[:3]
    bank = next((b for b in BANCOS_MEXICO if b["id"] == bank_code), None)
    return {"valid": True, "bank_code": bank_code, "bank_name": bank["name"] if bank else "Institución desconocida"}

