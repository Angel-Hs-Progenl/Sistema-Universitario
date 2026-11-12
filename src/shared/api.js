let csrf = "";
export const setCsrf = (value) => {
  csrf = value;
};
export async function api(path, options = {}) {
  const form = options.body instanceof FormData;
  let response;
  try {
    response = await fetch(`/api/v1${path}`, {
      credentials: "same-origin",
      ...options,
      headers: {
        ...(!form && options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        ...options.headers,
      },
      body: options.body && !form ? JSON.stringify(options.body) : options.body,
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el servicio. Verifica tu conexión e inténtalo de nuevo.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const labels = {
      name: "nombre completo",
      matricula: "matrícula",
      curp: "CURP",
      carrera: "carrera",
      generacion: "generación",
      telefono: "teléfono",
      domicilio: "domicilio",
      email: "correo electrónico",
      password: "contraseña",
      identifier: "correo institucional o teléfono vinculado",
      display_name: "nombre visible",
      note: "observación",
      reference: "referencia institucional",
      delivery: "indicaciones de entrega",
      title: "el nombre",
      description: "las bases de la convocatoria",
      min_gpa: "el promedio mínimo",
      gpa: "el promedio",
      current_gpa: "el promedio del nuevo periodo",
      amount: "el importe del apoyo",
      slots: "el número de apoyos",
      start_date: "la fecha de apertura",
      end_date: "la fecha de cierre",
      academic_term: "el periodo académico",
      major: "el programa educativo",
      monthly_income: "el ingreso mensual",
      monthly_expenses: "el gasto mensual",
      dependents_count: "el número de personas dependientes",
      minimum_responses: "el mínimo de participantes",
      questionnaire_id: "el cuestionario",
      teacher_id: "la cuenta del docente",
      student_id: "la cuenta del estudiante",
      subject: "la asignatura",
      group_name: "el grupo",
      action: "la acción del plan",
      evidence: "el avance del plan",
      due_date: "la fecha acordada",
      public_comment: "el comentario para publicar",
    };
    const instructions = {
      name: "Escribe tu nombre completo, entre 3 y 150 caracteres.",
      matricula:
        "Escribe una matrícula de 3 a 30 caracteres. Usa solo letras, números o guiones.",
      curp: "Revisa los 18 caracteres de tu CURP: letras en mayúsculas, fecha y dígitos tal como aparecen en tu constancia.",
      carrera: "Escribe el nombre de tu carrera, entre 3 y 150 caracteres.",
      generacion:
        "Escribe el año de ingreso y egreso con el formato AAAA-AAAA; por ejemplo, 2022-2026.",
      telefono:
        "Escribe un teléfono de 10 a 20 caracteres. Puedes usar +, espacios, paréntesis y guiones.",
      domicilio: "Escribe tu domicilio completo, entre 10 y 400 caracteres.",
      display_name: "Escribe un nombre visible de 1 a 80 caracteres.",
      monthly_income:
        "Escribe el ingreso mensual en pesos, sin negativos y con máximo dos decimales.",
      monthly_expenses:
        "Escribe el gasto mensual en pesos, sin negativos y con máximo dos decimales.",
      amount: "Escribe un importe mayor que cero y con máximo dos decimales.",
      gpa: "Escribe un promedio entre 6 y 10.",
      current_gpa: "Escribe el promedio del nuevo periodo, entre 6 y 10.",
      min_gpa: "Escribe el promedio mínimo de la convocatoria, entre 6 y 10.",
      minimum_responses:
        "Define el mínimo de participantes por docente, entre 2 y 500.",
      options:
        "Revisa el valor y la etiqueta de cada opción. Usa valores únicos de 1 a 10.",
      questions:
        "Revisa el texto, la sección y el peso de cada pregunta. Incluye las tres secciones y usa pesos mayores que cero.",
      custom_questions:
        "Escribe hasta 20 preguntas adicionales, una por línea y de hasta 300 caracteres.",
    };
    const fieldErrors = data.errors?.map((e) => ({
      field: e.field,
      message:
        instructions[e.field.split(".")[0]] ||
        `Revisa ${labels[e.field.split(".")[0]] || "este campo"}. El dato no cumple el formato solicitado.`,
    }));
    const fields = fieldErrors?.map((e) => e.message).join(" ");
    const error = new Error(
      fields ||
        (typeof data.detail === "string"
          ? data.detail
          : "No se pudo completar la operación."),
    );
    error.status = response.status;
    error.fields = fieldErrors;
    throw error;
  }
  return data;
}
export function date(value, time = false) {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(
    new Date(
      value.endsWith?.("Z") || /[+-]\d\d:\d\d$/.test(value)
        ? value
        : value + "Z",
    ),
  );
}
