from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Payload(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
        allow_inf_nan=False,
    )


class QuestionOption(Payload):
    value: str = Field(
        min_length=1,
        max_length=60,
        pattern=r"^[a-zA-Z0-9_-]+$",
    )
    label: str = Field(min_length=1, max_length=120)


class Question(Payload):
    id: str = Field(
        min_length=1,
        max_length=40,
        pattern=r"^[a-zA-Z0-9_-]+$",
    )
    type: Literal[
        "escala",
        "opcion_unica",
        "opcion_multiple",
        "texto_libre",
    ]
    text: str = Field(min_length=5, max_length=500)
    required: bool = True

    options: list[QuestionOption] = Field(
        default_factory=list,
        max_length=20,
    )

    min_value: int | None = None
    max_value: int | None = None
    max_length: int | None = None

    @model_validator(mode="after")
    def validate_question_configuration(self):
        if self.type == "escala":
            if self.min_value is None or self.max_value is None:
                raise ValueError(
                    "Las preguntas de escala requieren min_value y max_value."
                )

            if not 1 <= self.min_value < self.max_value <= 10:
                raise ValueError(
                    "La escala debe estar entre 1 y 10, con máximo superior al mínimo."
                )

            if self.options:
                raise ValueError(
                    "Las preguntas de escala no deben incluir opciones."
                )

            if self.max_length is not None:
                raise ValueError(
                    "Las preguntas de escala no utilizan max_length."
                )

        elif self.type in ("opcion_unica", "opcion_multiple"):
            if not 2 <= len(self.options) <= 20:
                raise ValueError(
                    "Las preguntas de selección requieren entre 2 y 20 opciones."
                )

            values = [option.value for option in self.options]

            if len(values) != len(set(values)):
                raise ValueError(
                    "Los valores de las opciones deben ser únicos."
                )

            if self.min_value is not None or self.max_value is not None:
                raise ValueError(
                    "Las preguntas de selección no utilizan límites numéricos."
                )

            if self.max_length is not None:
                raise ValueError(
                    "Las preguntas de selección no utilizan max_length."
                )

        elif self.type == "texto_libre":
            if not 1 <= (self.max_length or 0) <= 2000:
                raise ValueError(
                    "Las preguntas de texto requieren max_length entre 1 y 2000."
                )

            if self.options:
                raise ValueError(
                    "Las preguntas de texto no deben incluir opciones."
                )

            if self.min_value is not None or self.max_value is not None:
                raise ValueError(
                    "Las preguntas de texto no utilizan límites numéricos."
                )

        return self


class QuestionnairePayload(Payload):
    title: str = Field(min_length=3, max_length=150)
    questions: list[Question] = Field(min_length=1, max_length=100)

    @model_validator(mode="after")
    def validate_question_ids(self):
        ids = [question.id for question in self.questions]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "Los identificadores de las preguntas deben ser únicos."
            )

        return self


class EvaluationPayload(Payload):
    title: str = Field(min_length=3, max_length=150)
    questionnaire_id: int = Field(gt=0)

    subject: str = Field(min_length=3, max_length=150)
    group_name: str = Field(min_length=1, max_length=80)
    partial: str = Field(min_length=1, max_length=50)

    start_date: datetime
    end_date: datetime

    @model_validator(mode="after")
    def validate_dates(self):
        start = self.start_date
        end = self.end_date

        if start.tzinfo is None or start.utcoffset() is None:
            raise ValueError(
                "La fecha de apertura debe incluir zona horaria."
            )

        if end.tzinfo is None or end.utcoffset() is None:
            raise ValueError(
                "La fecha de cierre debe incluir zona horaria."
            )

        if end <= start:
            raise ValueError(
                "La fecha de cierre debe ser posterior a la apertura."
            )

        return self


class AssignmentPayload(Payload):
    student_ids: list[str] = Field(min_length=1, max_length=500)

    @model_validator(mode="after")
    def validate_student_ids(self):
        if len(self.student_ids) != len(set(self.student_ids)):
            raise ValueError(
                "No puedes seleccionar al mismo estudiante más de una vez."
            )

        return self


class EvaluationTransition(Payload):
    status: Literal["abierta", "cerrada"]
    version: int = Field(ge=1)


class SubmissionPayload(Payload):
    answers: dict[str, Any]