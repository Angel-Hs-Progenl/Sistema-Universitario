from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Payload(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, allow_inf_nan=False)


class Criterion(Payload):
    id: str = Field(min_length=1, max_length=40, pattern=r"^[a-zA-Z0-9_-]+$")
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=3, max_length=300)


class QuestionnairePayload(Payload):
    title: str = Field(min_length=3, max_length=150)
    criteria: list[Criterion] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def unique_criteria(self):
        ids = [criterion.id for criterion in self.criteria]
        if len(ids) != len(set(ids)):
            raise ValueError("Los identificadores de los criterios deben ser únicos.")
        return self


class ActivityPayload(Payload):
    title: str = Field(min_length=3, max_length=150)
    questionnaire_id: int = Field(gt=0)
    subject: str = Field(min_length=3, max_length=150)
    group_name: str = Field(min_length=1, max_length=80)
    partial: str = Field(min_length=1, max_length=50)
    start_date: datetime
    end_date: datetime

    @model_validator(mode="after")
    def valid_dates(self):
        if not self.start_date.tzinfo or not self.end_date.tzinfo:
            raise ValueError("Las fechas deben incluir zona horaria.")
        if self.end_date <= self.start_date:
            raise ValueError("La fecha de cierre debe ser posterior a la apertura.")
        return self


class Pair(Payload):
    evaluator_id: str
    peer_id: str

    @model_validator(mode="after")
    def distinct_students(self):
        if self.evaluator_id == self.peer_id:
            raise ValueError("Un estudiante no puede evaluarse a sí mismo.")
        return self


class AssignmentPayload(Payload):
    pairs: list[Pair] = Field(min_length=1, max_length=500)

    @model_validator(mode="after")
    def unique_pairs(self):
        pairs = [(pair.evaluator_id, pair.peer_id) for pair in self.pairs]
        if len(pairs) != len(set(pairs)):
            raise ValueError("No repitas una pareja en la misma solicitud.")
        return self


class ActivityTransition(Payload):
    status: Literal["abierta", "cerrada"]
    version: int = Field(ge=1)


class SubmissionPayload(Payload):
    scores: dict[str, int]
    strength: str = Field(default="", max_length=1000)
    improvement: str = Field(default="", max_length=1000)
