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
    const fields = data.errors
      ?.map((e) => `${e.field}: ${e.message}`)
      .join(" · ");
    const error = new Error(
      fields ||
        (typeof data.detail === "string"
          ? data.detail
          : "No se pudo completar la operación."),
    );
    error.status = response.status;
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
