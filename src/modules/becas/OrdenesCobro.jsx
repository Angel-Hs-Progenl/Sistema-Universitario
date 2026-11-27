import { useState } from "react";
import {
  CreditCard,
  DollarSign,
  Plus,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
  FileSpreadsheet,
} from "lucide-react";
import { api, date } from "../../shared/api";
import { useAuth } from "../../app/Auth";
import { Modal, Field, BusyButton, Alert, useAsync } from "../../shared/ui";

export default function OrdenesCobro() {
  const { user } = useAuth();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [appId, setAppId] = useState("");
  const [period, setPeriod] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Cálculo de la orden interna
  const [cuotaBase, setCuotaBase] = useState("");
  const [orderStudentPct, setOrderStudentPct] = useState("");

  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const [externalReference, setExternalReference] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Registro manual de una dispersión externa
  const [disperseOrderId, setDisperseOrderId] = useState(null);
  const [batchFolio, setBatchFolio] = useState("");
  const [dispersing, setDispersing] = useState(false);
  const [disperseErr, setDisperseErr] = useState("");

  const { data: orders, loading, error, refresh: refreshOrders } = useAsync(
    () => api("/becas/ordenes-cobro"),
    []
  );

  const { data: approvedApps, loading: loadingCandidates, error: candidatesError } = useAsync(
    () => (user.role === "tesoreria" ? api("/becas/ordenes-cobro/elegibles") : Promise.resolve([])),
    []
  );

  const totalAmount = (orders || []).filter((order) => order.status !== "cancelada").reduce((acc, curr) => acc + (curr.amount || 0), 0);

  async function handleConfirmPayment(e) {
    e.preventDefault();
    setVerifying(true);
    setErrorMsg("");
    try {
      await api(`/becas/ordenes-cobro/${paymentOrderId}/confirmar-pago`, {
        method: "POST",
        body: { external_reference: externalReference.trim() },
      });
      setSuccessMsg("Verificación manual del pago registrada por Tesorería.");
      setPaymentOrderId(null);
      setExternalReference("");
      refreshOrders();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setVerifying(false);
    }
  }

  async function handleRejectPayment(orderId) {
    if (!window.confirm("¿Devolver a pendiente la verificación manual de esta orden?")) return;
    try {
      await api(`/becas/ordenes-cobro/${orderId}/rechazar-pago`, { method: "POST" });
      setSuccessMsg("La verificación volvió a estado pendiente.");
      refreshOrders();
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  async function handleCancelOrder(orderId, folio) {
    if (!window.confirm(`¿Anular la orden programada ${folio}? Se conservará el registro.`)) return;
    try {
      await api(`/becas/ordenes-cobro/${orderId}`, { method: "DELETE" });
      setSuccessMsg(`Orden ${folio} anulada.`);
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
          cuota_base: Number(cuotaBase),
          student_percentage: orderStudentPct === "" ? undefined : Number(orderStudentPct),
        },
      });
      setSuccessMsg(`Orden interna ${res.folio_orden} registrada por $${res.amount.toFixed(2)} MXN. Tesorería debe proporcionar las instrucciones de pago.`);
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
      setSuccessMsg(`Referencia de dispersión externa registrada: ${res.batch_folio}.`);
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
            Órdenes internas de becas
          </h2>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
            Tesorería registra importes y verifica pagos con evidencia externa. El portal no genera líneas de captura ni procesa pagos.
          </p>
        </div>
        {user.role === "tesoreria" && (
          <button
            type="button"
            className="button button-primary"
            onClick={() => {
              setShowGenerateModal(true);
              setErrorMsg("");
              setSuccessMsg("");
            }}
          >
            <Plus size={16} /> Registrar orden interna
          </button>
        )}
      </div>

      {successMsg && (
        <div className="alert success" style={{ marginBottom: "16px" }}>
          <CheckCircle size={18} />
          <div>{successMsg}</div>
        </div>
      )}
      {errorMsg && !showGenerateModal && !paymentOrderId && <Alert>{errorMsg}</Alert>}

      {/* Tarjetas resumen */}
      <div className="becas-stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Órdenes generadas</span>
          <span className="stat-card-value">{orders ? orders.length : 0}</span>
          <span className="stat-card-sub">Registros visibles para tu rol</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Monto total programado</span>
          <span className="stat-card-value">${totalAmount.toLocaleString("es-MX")}</span>
          <span className="stat-card-sub">Suma de órdenes mostradas</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Fecha programada más reciente</span>
          <span className="stat-card-value" style={{ fontSize: "1.25rem" }}>
            {orders && orders.length > 0 ? date(orders[0].scheduled_date) : "Sin fechas"}
          </span>
          <span className="stat-card-sub">Según órdenes registradas</span>
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
                <th style={{ padding: "10px 12px" }}>Referencia interna o verificada</th>
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
                      <div style={{ fontWeight: "600" }}>{ord.student_name || "Identidad reservada"}</div>
                      <small style={{ color: "var(--muted)" }}>Folio: {ord.application_folio}</small>
                    </td>
                    <td style={{ padding: "12px", fontSize: "0.875rem" }}>
                      {ord.call_title}
                      <small style={{ display: "block", color: "var(--muted)" }}>{ord.period}</small>
                    </td>
                    <td style={{ padding: "12px", fontSize: "0.875rem" }}>
                      ${ord.cuota_base.toLocaleString("es-MX")} MXN
                    </td>
                    <td style={{ padding: "12px" }}>
                      <strong style={{ color: "var(--brand)" }}>{ord.student_percentage == null ? "Sin porcentaje" : `${ord.student_percentage}% a pagar`}</strong>
                      <small style={{ display: "block", color: "var(--green)" }}>
                        {ord.discount_percentage == null ? "Apoyo sin porcentaje registrado" : `(${ord.discount_percentage}% de apoyo)`}
                      </small>
                    </td>
                    <td style={{ padding: "12px", fontWeight: "700", color: "var(--brand)", fontSize: "0.9375rem" }}>
                      ${ord.amount.toLocaleString("es-MX")} MXN
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: "0.8125rem", fontWeight: "700" }}>
                        {ord.reference || ord.folio_orden}
                      </div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span className={`badge ${ord.status === "pagada" ? "badge-validado" : ord.status === "dispersada" ? "badge-validado" : "badge-pendiente"}`}>
                        {ord.status === "pagada" ? "Pago verificado manualmente" : ord.status === "dispersada" ? "Dispersión externa registrada" : ord.status === "cancelada" ? "Anulada" : "Pendiente de verificación"}
                      </span>
                      {ord.paid_at && (
                        <small style={{ display: "block", color: "var(--green)", fontSize: "0.75rem" }}>
                          Validado por Tesorería
                        </small>
                      )}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        {user.role === "tesoreria" && ord.status === "programada" && (
                          <button
                            type="button"
                            className="button button-primary"
                            style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                            onClick={() => { setPaymentOrderId(ord.id); setExternalReference(""); setErrorMsg(""); }}
                            title="Registrar referencia de un pago comprobado externamente"
                          >
                            <CheckCircle size={12} /> Registrar verificación
                          </button>
                        )}
                        {user.role === "tesoreria" && ord.status === "pagada" && (
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ fontSize: "0.75rem", padding: "4px 8px", color: "#B8862B" }}
                            onClick={() => handleRejectPayment(ord.id)}
                            title="Devolver la verificación a pendiente"
                          >
                            <XCircle size={12} /> Revertir verificación
                          </button>
                        )}
                        {user.role === "tesoreria" && ord.status === "pagada" && (
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                            onClick={() => {
                              setDisperseOrderId(ord.id);
                              setDisperseErr("");
                            }}
                          >
                            <CreditCard size={12} /> Registrar dispersión externa
                          </button>
                        )}
                        {user.role === "tesoreria" && ord.status === "programada" && (
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ fontSize: "0.75rem", padding: "4px 8px", color: "#b91c1c" }}
                            onClick={() => handleCancelOrder(ord.id, ord.folio_orden)}
                            title="Anular la orden y conservar su historial"
                          >
                            <Trash2 size={12} /> Anular
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
        <Modal title="Registrar orden interna (Tesorería)" onClose={() => setShowGenerateModal(false)}>
          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {errorMsg && <Alert>{errorMsg}</Alert>}
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
              Tesorería registra el importe previsto. La orden interna no contiene una línea de captura externa.
            </p>

            <div className="field">
              <label htmlFor="appSelect">Beca aprobada del aspirante *</label>
              {loadingCandidates && <p>Cargando solicitudes aprobadas…</p>}
              {candidatesError && <Alert>{candidatesError}</Alert>}
              {approvedApps?.length === 0 && !loadingCandidates && <p>No hay solicitudes aprobadas disponibles.</p>}
              <select
                id="appSelect"
                required
                value={appId}
                onChange={(e) => {
                  const selId = e.target.value;
                  setAppId(selId);
                  const selApp = (approvedApps || []).find((a) => a.id === parseInt(selId, 10));
                  if (selApp?.student_percentage != null) {
                    setOrderStudentPct(String(selApp.student_percentage));
                  } else {
                    setOrderStudentPct("");
                  }
                }}
                style={{ padding: "8px" }}
              >
                <option value="">Selecciona una beca aprobada…</option>
                {(approvedApps || []).map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.folio} - {app.applicant.name} ({app.call_title} · {app.student_percentage == null ? "Porcentaje sin registrar" : `Aportación ${app.student_percentage}%`})
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
                hint="Importe confirmado por Tesorería para este periodo."
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
                hint="Usa el porcentaje registrado en el dictamen o captúralo tras verificarlo."
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
              <strong>Cálculo de la orden interna:</strong>
              <div style={{ marginTop: "4px", display: "flex", justifyContent: "space-between" }}>
                <span>Monto a pagar por el alumno:</span>
                <strong style={{ color: "var(--brand)", fontSize: "1rem" }}>
                  {cuotaBase !== "" && orderStudentPct !== "" ? `$${((Number(cuotaBase) * Number(orderStudentPct)) / 100).toFixed(2)} MXN` : "Completa importe y porcentaje"}
                </strong>
              </div>
              <div style={{ marginTop: "2px", display: "flex", justifyContent: "space-between", color: "var(--green)" }}>
                <span>Beca institucional aplicada:</span>
                <strong>{orderStudentPct !== "" ? `${100 - Number(orderStudentPct)}% de apoyo` : "Sin calcular"}</strong>
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
                Registrar orden
              </BusyButton>
            </div>
          </form>
        </Modal>
      )}

      {paymentOrderId && (
        <Modal title="Registrar verificación de pago" onClose={() => setPaymentOrderId(null)}>
          <form onSubmit={handleConfirmPayment} style={{ display: "grid", gap: "14px" }}>
            {errorMsg && <Alert>{errorMsg}</Alert>}
            <p>Comprueba el pago fuera del portal antes de registrar la referencia. Esta acción no consulta a un proveedor bancario.</p>
            <Field
              label="Referencia externa del pago comprobado"
              required
              minLength={3}
              maxLength={100}
              value={externalReference}
              onChange={(e) => setExternalReference(e.target.value)}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button type="button" className="button button-secondary" onClick={() => setPaymentOrderId(null)} disabled={verifying}>Cancelar</button>
              <BusyButton busy={verifying} busyText="Registrando…" type="submit" className="button button-primary">Registrar verificación manual</BusyButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Registro de una dispersión reportada por Tesorería */}
      {disperseOrderId && (
        <Modal title="Registrar dispersión externa (Tesorería)" onClose={() => setDisperseOrderId(null)}>
          <form onSubmit={handleDisperse} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
              Captura una referencia de una operación ya realizada fuera del portal. Este sistema no ejecuta transferencias.
            </p>
            {disperseErr && <Alert>{disperseErr}</Alert>}
            <Field
              label="Referencia externa de la operación *"
              required
              value={batchFolio}
              onChange={(e) => setBatchFolio(e.target.value)}
              hint="Copia la referencia de la evidencia bancaria verificada por Tesorería."
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
              <BusyButton busy={dispersing} busyText="Registrando…" type="submit" className="button button-primary">
                Registrar referencia
              </BusyButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
