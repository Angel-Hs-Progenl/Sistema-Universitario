import { useState } from "react";
import {
  Calendar,
  CreditCard,
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  ArrowUpRight,
  FileSpreadsheet,
} from "lucide-react";
import { api, date } from "../../shared/api";
import { useAuth } from "../../app/Auth";
import { Modal, Field, BusyButton, Alert, useAsync } from "../../shared/ui";

export default function OrdenesCobro() {
  const { user } = useAuth();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [appId, setAppId] = useState("");
  const [period, setPeriod] = useState("Parcial 2 - Julio 2026");
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Pagos en Línea Gobierno de Puebla & Porcentajes
  const [cuotaBase, setCuotaBase] = useState("1850");
  const [orderStudentPct, setOrderStudentPct] = useState("53");

  // Dispersión SPEI state
  const [disperseOrderId, setDisperseOrderId] = useState(null);
  const [batchFolio, setBatchFolio] = useState("LOTE-SPEI-UTO-01");
  const [dispersing, setDispersing] = useState(false);
  const [disperseErr, setDisperseErr] = useState("");

  const { data: orders, loading, error, refresh: refreshOrders } = useAsync(
    () => api("/becas/ordenes-cobro"),
    []
  );

  const { data: approvedApps } = useAsync(
    () => (user.role !== "estudiante" ? api("/becas/solicitudes?status=aprobada") : Promise.resolve([])),
    []
  );

  const totalAmount = (orders || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);

  async function handleConfirmPayment(orderId) {
    try {
      await api(`/becas/ordenes-cobro/${orderId}/confirmar-pago`, { method: "POST" });
      setSuccessMsg("Pago validado por Tesorería correctamente. Beca y reinscripción confirmadas.");
      refreshOrders();
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api("/becas/ordenes-cobro/generar", {
        method: "POST",
        body: {
          application_id: parseInt(appId, 10),
          period,
          scheduled_date: `${scheduledDate}T12:00:00Z`,
          cuota_base: parseFloat(cuotaBase) || 1850,
          student_percentage: parseFloat(orderStudentPct) || undefined,
        },
      });
      setSuccessMsg(`Orden ${res.folio_orden} generada. Monto a pagar: $${res.amount.toFixed(2)} MXN (${res.student_percentage}% a pagar). Ref. Gob. Puebla: ${res.puebla_reference}`);
      setShowGenerateModal(false);
      refreshOrders();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDisperse(e) {
    e.preventDefault();
    setDispersing(true);
    setDisperseErr("");
    try {
      const res = await api(`/becas/ordenes-cobro/${disperseOrderId}/dispersar`, {
        method: "POST",
        body: { batch_folio: batchFolio },
      });
      setSuccessMsg(`Dispersión exitosa. Lote: ${res.batch_folio}`);
      setDisperseOrderId(null);
      refreshOrders();
    } catch (err) {
      setDisperseErr(err.message);
    } finally {
      setDispersing(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "1.25rem", color: "var(--brand)" }}>
            Tesorería: Órdenes de Pago y Pagos en Línea (Gobierno de Puebla)
          </h2>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
            Emisión de órdenes de reinscripción con porcentaje de beca diferenciado (53%, 65%, etc.) y referencias para Pagos en Línea del Estado de Puebla.
          </p>
        </div>
        {user.role !== "estudiante" && (
          <button
            type="button"
            className="button button-primary"
            onClick={() => {
              setShowGenerateModal(true);
              setErrorMsg("");
              setSuccessMsg("");
            }}
          >
            <Plus size={16} /> Emitir orden de cobro
          </button>
        )}
      </div>

      {successMsg && (
        <div className="alert success" style={{ marginBottom: "16px" }}>
          <CheckCircle size={18} />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Tarjetas resumen */}
      <div className="becas-stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Órdenes generadas</span>
          <span className="stat-card-value">{orders ? orders.length : 0}</span>
          <span className="stat-card-sub">En calendario activo</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Monto total programado</span>
          <span className="stat-card-value">${totalAmount.toLocaleString("es-MX")}</span>
          <span className="stat-card-sub">Presupuesto institucional UTO</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Próxima dispersión</span>
          <span className="stat-card-value" style={{ fontSize: "1.25rem" }}>
            {orders && orders.length > 0 ? date(orders[0].scheduled_date) : "Sin fechas"}
          </span>
          <span className="stat-card-sub">Según calendario escolar</span>
        </div>
      </div>

      {/* Calendario de fechas clave */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          padding: "16px",
          borderRadius: "var(--radius)",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--brand)", marginBottom: "8px" }}>
          <Calendar size={18} />
          <h3 style={{ margin: 0, fontSize: "1rem" }}>Calendario Institucional de Pagos UTO 2026</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginTop: "12px" }}>
          <div style={{ background: "var(--canvas)", padding: "10px", borderRadius: "var(--radius)" }}>
            <strong>1er Parcial (Primavera):</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
              Generación: 15 de mayo de 2026<br />Dispersión: 20 al 25 de mayo de 2026
            </p>
          </div>
          <div style={{ background: "var(--canvas)", padding: "10px", borderRadius: "var(--radius)" }}>
            <strong>2do Parcial (Verano):</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
              Generación: 10 de julio de 2026<br />Dispersión: 15 al 20 de julio de 2026
            </p>
          </div>
          <div style={{ background: "var(--canvas)", padding: "10px", borderRadius: "var(--radius)" }}>
            <strong>3er Parcial (Cierre):</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
              Generación: 18 de agosto de 2026<br />Dispersión: 22 al 27 de agosto de 2026
            </p>
          </div>
        </div>
      </div>

      {loading && <p>Cargando órdenes de cobro…</p>}
      {error && <Alert>{error}</Alert>}

      {orders && (
        <div className="audit-table-wrapper">
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--canvas)", textAlign: "left", fontSize: "0.8125rem" }}>
                <th style={{ padding: "10px 12px" }}>Folio Orden</th>
                <th style={{ padding: "10px 12px" }}>Estudiante / Beca</th>
                <th style={{ padding: "10px 12px" }}>Convocatoria</th>
                <th style={{ padding: "10px 12px" }}>Cuota base</th>
                <th style={{ padding: "10px 12px" }}>% a Pagar / Beca</th>
                <th style={{ padding: "10px 12px" }}>Monto final</th>
                <th style={{ padding: "10px 12px" }}>Ref. Gob. de Puebla</th>
                <th style={{ padding: "10px 12px" }}>Estado</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                    No hay órdenes de pago emitidas para el periodo actual.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "12px", fontWeight: "700" }}>{ord.folio_orden}</td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ fontWeight: "600" }}>{ord.student_name}</div>
                      <small style={{ color: "var(--muted)" }}>Folio: {ord.application_folio}</small>
                    </td>
                    <td style={{ padding: "12px", fontSize: "0.875rem" }}>
                      {ord.call_title}
                      <small style={{ display: "block", color: "var(--muted)" }}>{ord.period}</small>
                    </td>
                    <td style={{ padding: "12px", fontSize: "0.875rem" }}>
                      ${(ord.cuota_base || 1850).toLocaleString("es-MX")} MXN
                    </td>
                    <td style={{ padding: "12px" }}>
                      <strong style={{ color: "var(--brand)" }}>{ord.student_percentage || 50}% a pagar</strong>
                      <small style={{ display: "block", color: "var(--green)" }}>
                        ({ord.discount_percentage || (100 - (ord.student_percentage || 50))}% de beca)
                      </small>
                    </td>
                    <td style={{ padding: "12px", fontWeight: "700", color: "var(--brand)", fontSize: "0.9375rem" }}>
                      ${ord.amount.toLocaleString("es-MX")} MXN
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: "0.8125rem", fontWeight: "700" }}>
                        {ord.puebla_reference || ord.reference}
                      </div>
                      <a
                        href={ord.puebla_url || "https://pagosenlinea.puebla.gob.mx/"}
                        target="_blank"
                        rel="noreferrer"
                        className="button button-secondary"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.6875rem", padding: "2px 6px", marginTop: "4px" }}
                      >
                        <ArrowUpRight size={12} /> Pagos en Línea Puebla
                      </a>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span className={`badge ${ord.status === "pagada" ? "badge-validado" : ord.status === "dispersada" ? "badge-validado" : "badge-pendiente"}`}>
                        {ord.status === "pagada" ? "Pagada en línea" : ord.status === "dispersada" ? "Dispersada" : "Pendiente de pago"}
                      </span>
                      {ord.paid_at && (
                        <small style={{ display: "block", color: "var(--green)", fontSize: "0.75rem" }}>
                          Validado por Tesorería
                        </small>
                      )}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        {user.role !== "estudiante" && ord.status === "programada" && (
                          <button
                            type="button"
                            className="button button-primary"
                            style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                            onClick={() => handleConfirmPayment(ord.id)}
                          >
                            <CheckCircle size={12} /> Validar Pago
                          </button>
                        )}
                        {user.role !== "estudiante" && ord.status !== "dispersada" && (
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                            onClick={() => {
                              setDisperseOrderId(ord.id);
                              setDisperseErr("");
                            }}
                          >
                            <CreditCard size={12} /> Dispersar SPEI
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Emisión de Orden de Cobro */}
      {showGenerateModal && (
        <Modal title="Emitir Orden de Pago Institucional (Tesorería)" onClose={() => setShowGenerateModal(false)}>
          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Alert>{errorMsg}</Alert>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
              Tesorería genera la orden con el porcentaje de beca otorgado en el dictamen para su pago a través del portal de <strong>Pagos en Línea del Gobierno de Puebla</strong>.
            </p>

            <div className="field">
              <label htmlFor="appSelect">Beca aprobada del aspirante *</label>
              <select
                id="appSelect"
                required
                value={appId}
                onChange={(e) => {
                  const selId = e.target.value;
                  setAppId(selId);
                  const selApp = (approvedApps || []).find((a) => a.id === parseInt(selId, 10));
                  if (selApp?.student_percentage) {
                    setOrderStudentPct(String(selApp.student_percentage));
                  }
                }}
                style={{ padding: "8px" }}
              >
                <option value="">Selecciona una beca aprobada…</option>
                {(approvedApps || []).map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.folio} - {app.applicant.name} ({app.call_title} · Paga {app.student_percentage || 50}%)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field
                label="Cuota ordinaria institucional ($ MXN) *"
                type="number"
                step="50"
                min="100"
                required
                value={cuotaBase}
                onChange={(e) => setCuotaBase(e.target.value)}
                hint="Monto ordinario de reinscripción UTO."
              />
              <Field
                label="Porcentaje a pagar por el alumno (%) *"
                type="number"
                step="1"
                min="0"
                max="100"
                required
                value={orderStudentPct}
                onChange={(e) => setOrderStudentPct(e.target.value)}
                hint="Ej. 53% o 65% según dictamen."
              />
            </div>

            <div
              style={{
                background: "var(--canvas)",
                border: "1px solid var(--gold)",
                padding: "12px",
                borderRadius: "var(--radius)",
                fontSize: "0.875rem",
              }}
            >
              <strong>Cálculo final para Pagos en Línea Gob. Puebla:</strong>
              <div style={{ marginTop: "4px", display: "flex", justifyContent: "space-between" }}>
                <span>Monto a pagar por el alumno:</span>
                <strong style={{ color: "var(--brand)", fontSize: "1rem" }}>
                  ${(((parseFloat(cuotaBase) || 1850) * (parseFloat(orderStudentPct) || 50)) / 100).toFixed(2)} MXN
                </strong>
              </div>
              <div style={{ marginTop: "2px", display: "flex", justifyContent: "space-between", color: "var(--green)" }}>
                <span>Beca institucional aplicada:</span>
                <strong>{100 - (parseFloat(orderStudentPct) || 50)}% de descuento</strong>
              </div>
            </div>

            <Field
              label="Periodo / Cuatrimestre de aplicación"
              required
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Ej. Reinscripción Cuatrimestral - Mayo 2026"
            />

            <Field
              label="Fecha límite programada de pago"
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowGenerateModal(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <BusyButton busy={saving} busyText="Generando orden…" type="submit" className="button button-primary">
                Emitir orden con Ref. Puebla
              </BusyButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Dispersión SPEI */}
      {disperseOrderId && (
        <Modal title="Registrar Dispersión SPEI (Tesorería)" onClose={() => setDisperseOrderId(null)}>
          <form onSubmit={handleDisperse} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
              Al confirmar la dispersión, la orden de cobro quedará registrada como pagada con su folio de lote bancario y se enviará notificación automática al alumno beneficiario.
            </p>
            {disperseErr && <Alert>{disperseErr}</Alert>}
            <Field
              label="Folio o ID de Lote Bancario SPEI *"
              required
              value={batchFolio}
              onChange={(e) => setBatchFolio(e.target.value)}
              placeholder="Ej. SPEI-UTO-2026-LOTE01"
              hint="Referencia provista por el portal de banca empresarial o STP."
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setDisperseOrderId(null)}
                disabled={dispersing}
              >
                Cancelar
              </button>
              <BusyButton busy={dispersing} busyText="Dispersando…" type="submit" className="button button-primary">
                Confirmar dispersión bancaria
              </BusyButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
