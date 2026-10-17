"""Dominio y reglas de negocio del módulo de becas UTO."""

MODALIDADES = [
    {
        "id": "academica",
        "name": "Excelencia Académica",
        "description": "Para estudiantes con promedio sobresaliente de 9.0 o superior.",
        "minGpa": 9.0,
        "defaultAmount": 4500,
    },
    {
        "id": "manutencion",
        "name": "Apoyo a la Manutención",
        "description": "Apoyo económico a estudiantes en situación de vulnerabilidad económica.",
        "minGpa": 8.0,
        "defaultAmount": 3600,
    },
    {
        "id": "transporte",
        "name": "Subsidio de Transporte y Movilidad",
        "description": "Para estudiantes que se trasladan diariamente desde municipios alejados a Oriental.",
        "minGpa": 8.0,
        "defaultAmount": 2400,
    },
    {
        "id": "alimentacion",
        "name": "Beca de Comedor y Alimentación",
        "description": "Subsidio para acceso al comedor universitario por vulnerabilidad alimentaria.",
        "minGpa": 7.5,
        "defaultAmount": 1800,
    },
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
        "id": "kardex",
        "name": "Kárdex o constancia de calificaciones",
        "required": True,
        "formats": ["application/pdf", "image/jpeg", "image/png"],
    },
    {
        "id": "comprobante_ingresos",
        "name": "Comprobante de ingresos familiares",
        "required": True,
        "formats": ["application/pdf", "image/jpeg"],
    },
    {
        "id": "comprobante_domicilio",
        "name": "Comprobante de domicilio (no mayor a 3 meses)",
        "required": True,
        "formats": ["application/pdf", "image/jpeg"],
    },
    {
        "id": "identificacion",
        "name": "Credencial institucional o INE",
        "required": True,
        "formats": ["application/pdf", "image/jpeg"],
    },
    {
        "id": "carta_motivos",
        "name": "Carta de exposición de motivos",
        "required": False,
        "formats": ["application/pdf"],
    },
]

ESTADOS_ORDEN = {
    "programada": "Programada",
    "emitida": "Orden emitida",
    "dispersada": "Dispersada",
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

    if housing_type == "rentada":
        score += 10.0
    elif housing_type == "prestada":
        score += 5.0

    if monthly_expenses > monthly_income:
        score += 10.0

    return min(100.0, max(10.0, round(score, 1)))


def evaluate_applicant_rules(applicant_gpa: float, call_min_gpa: float):
    """Reglas automáticas de filtrado de postulantes."""
    issues = []
    if applicant_gpa < call_min_gpa:
        issues.append(
            f"El promedio registrado ({applicant_gpa:.1f}) no cumple con el mínimo requerido ({call_min_gpa:.1f})."
        )
    return {
        "meets_requirements": len(issues) == 0,
        "issues": issues,
    }
