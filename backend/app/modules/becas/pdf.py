"""PDFs de consulta de Becas con el membrete proporcionado para el módulo."""

from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import HRFlowable, KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


LETTERHEAD = Path(__file__).resolve().parents[4] / "src/modules/becas/assets/membrete-uto.png"
BRAND = colors.HexColor("#6F1738")
LINE = colors.HexColor("#DEDFD5")
INK = colors.HexColor("#202124")


def _value(value, blank="________"):
    return escape(str(value).strip()) if value is not None and str(value).strip() else blank


def _money(value):
    return f"${value:,.2f} MXN" if value is not None else "________ MXN"


def render_anexo1_pdf(data: dict) -> bytes:
    """Devuelve un PDF carta; el membrete cubre cada página sin márgenes del navegador."""
    output = BytesIO()
    doc = SimpleDocTemplate(
        output,
        pagesize=letter,
        leftMargin=60,
        rightMargin=60,
        topMargin=119,
        bottomMargin=56,
        title="Anexo 1 - Beca de Escasos Recursos Económicos",
        author="Portal universitario",
    )
    page_width, page_height = letter
    image = ImageReader(str(LETTERHEAD))

    def draw_background(canvas, _doc):
        canvas.drawImage(image, 0, 0, width=page_width, height=page_height, mask="auto")

    title = ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=12.2, leading=15, textColor=BRAND, alignment=TA_CENTER, spaceAfter=5)
    subtitle = ParagraphStyle("subtitle", fontName="Helvetica", fontSize=9, leading=12, textColor=INK, alignment=TA_CENTER)
    body = ParagraphStyle("body", fontName="Helvetica", fontSize=9.4, leading=13.4, textColor=INK, alignment=TA_JUSTIFY, spaceAfter=12)
    left = ParagraphStyle("left", parent=body, alignment=0)
    right = ParagraphStyle("right", parent=body, alignment=TA_RIGHT)
    center = ParagraphStyle("center", parent=body, alignment=TA_CENTER)
    small = ParagraphStyle("small", fontName="Helvetica", fontSize=7.6, leading=10.5, textColor=INK, alignment=TA_JUSTIFY)
    small_center = ParagraphStyle("small-center", parent=small, alignment=TA_CENTER)

    student = data["student"]
    call = data["call"]
    detail = data["anexo1_data"]
    name = _value(student.get("name"), "_________________________________")
    period = _value(call.get("periodo"), "periodo no indicado")
    no_external = detail.get("no_beca_externa") is True

    story = [
        Paragraph("ANEXO 1: CARTA BAJO PROTESTA DE DECIR VERDAD", title),
        Paragraph(f"Beca de Escasos Recursos Económicos - Periodo {period}", subtitle),
        Spacer(1, 9),
        HRFlowable(width="100%", thickness=0.7, color=BRAND),
        Spacer(1, 13),
        Paragraph(f"<b>{_value(data.get('city'), 'Oriental')}, {_value(data.get('state'), 'Puebla')}</b>; a {_value(data.get('date_str'))}.", right),
        Paragraph("<b>COMITÉ DE BECAS<br/>DE LA UNIVERSIDAD TECNOLÓGICA DE ORIENTAL</b><br/>PRESENTE", left),
        Paragraph(
            f"La(el) que suscribe <b>{name}</b> estudiante del Programa Educativo de "
            f"<b>{_value(student.get('major'), '_________________________________')}</b>, que cursa "
            f"<b>{_value(student.get('academic_term'), '_____')}</b>, con matrícula: "
            f"<b>{_value(student.get('matricula'), '_______________')}</b>; en cumplimiento con lo señalado "
            f"en la Convocatoria de Becas Institucionales para el periodo <b>{period}</b> en el apartado segundo, "
            "numeral 2.2 inciso e), manifiesto lo siguiente:",
            body,
        ),
    ]

    economic = Paragraph(
        f"Dependo económicamente de la(s) persona(s): <b>{_value(detail.get('depende_de'), '____________________')}</b> "
        f"(parentesco: <b>{_value(detail.get('parentesco'))}</b>), de ocupación "
        f"<b>{_value(detail.get('ocupacion'), '____________________')}</b> con un ingreso familiar mensual de "
        f"<b>{_money(detail.get('ingreso_mensual'))}</b>, del cual dependemos "
        f"<b>{_value(detail.get('personas_dependientes'), '_____')}</b> personas; los gastos mensuales de mi "
        f"familia ascienden a <b>{_money(detail.get('gastos_mensuales'))}</b> y en el rubro de transporte pago "
        f"la cantidad de <b>{_money(detail.get('transporte_diario'))}</b> diario.",
        body,
    )
    box = Table([[economic]], colWidths=[492], hAlign="LEFT")
    box.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.extend([box, Spacer(1, 12)])

    external_statement = (
        "<b>no soy beneficiaria(o) de ningún tipo de beca externa</b>"
        if no_external else
        "<b>debo revisar mi declaración sobre becas externas antes de firmar este formato</b>"
    )
    story.extend([
        Paragraph(
            "De la misma manera, de conformidad con el numeral 2.2 inciso c) de la misma convocatoria, "
            f"actualmente {external_statement}.",
            body,
        ),
        Paragraph(
            "Declaro bajo protesta de decir verdad que la información antes proporcionada es verídica y correcta, "
            "y autorizo al personal de la Universidad Tecnológica de Oriental a verificar los datos asentados "
            "en la solicitud de Beca de Escasos Recursos Económicos y, en caso de encontrar falsedad en los mismos, "
            "será motivo de anulación.",
            body,
        ),
        KeepTogether([
            Spacer(1, 17),
            Paragraph("<b>ATENTAMENTE</b>", center),
            Spacer(1, 32),
            HRFlowable(width=245, thickness=0.6, color=INK, hAlign="CENTER"),
            Spacer(1, 5),
            Paragraph(f"<b>{name}</b>", center),
            Paragraph("NOMBRE COMPLETO Y FIRMA AUTÓGRAFA (TINTA AZUL)", small_center),
        ]),
        Spacer(1, 13),
        HRFlowable(width="100%", thickness=0.5, color=LINE),
        Spacer(1, 7),
        Paragraph(
            "Los datos personales recabados serán protegidos, incorporados y tratados en la base de datos "
            "correspondiente, de conformidad con lo dispuesto en los artículos 10 fracciones I y VII, "
            "13 fracciones VIII y IX del Decreto de Creación de la Universidad Tecnológica de Oriental, "
            "y la Ley de Protección de Datos Personales en Posesión de Sujetos Obligados del Estado de Puebla.",
            small,
        ),
    ])

    doc.build(story, onFirstPage=draw_background, onLaterPages=draw_background)
    return output.getvalue()
