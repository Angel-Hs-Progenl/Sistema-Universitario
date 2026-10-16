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
    };
    const fieldErrors = data.errors?.map((e) => ({
      field: e.field,
      message:
        instructions[e.field] ||
        `Revisa ${labels[e.field] || "este campo"}. El dato no cumple el formato solicitado.`,
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
