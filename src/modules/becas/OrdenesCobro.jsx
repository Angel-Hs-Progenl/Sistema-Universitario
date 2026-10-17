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

  const { data: orders, loading, error, refresh: refreshOrders } = useAsync(
    () => api("/becas/ordenes-cobro"),
    []
  );

  const { data: approvedApps } = useAsync(
    () => (user.role !== "estudiante" ? api("/becas/solicitudes?status=aprobada") : Promise.resolve([])),
    []
  );

  const totalAmount = (orders || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);

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
        },
      });
      setSuccessMsg(res.message);
      setShowGenerateModal(false);
      refreshOrders();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "1.25rem", color: "var(--brand)" }}>
            Calendario de Pagos y Órdenes de Cobro
          </h2>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
            Programación de dispersiones, emisión de referencias bancarias y control presupuestal de becas.
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
                <th style={{ padding: "10px 12px" }}>Folio de Orden</th>
                <th style={{ padding: "10px 12px" }}>Folio Beca</th>
                <th style={{ padding: "10px 12px" }}>Estudiante</th>
                <th style={{ padding: "10px 12px" }}>Convocatoria</th>
                <th style={{ padding: "10px 12px" }}>Periodo</th>
                <th style={{ padding: "10px 12px" }}>Monto</th>
                <th style={{ padding: "10px 12px" }}>Fecha programada</th>
                <th style={{ padding: "10px 12px" }}>Referencia SPEI</th>
                <th style={{ padding: "10px 12px" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                    No hay órdenes de cobro emitidas para el periodo actual.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "12px", fontWeight: "700" }}>{ord.folio_orden}</td>
                    <td style={{ padding: "12px" }}>{ord.application_folio}</td>
                    <td style={{ padding: "12px", fontWeight: "600" }}>{ord.student_name}</td>
                    <td style={{ padding: "12px", fontSize: "0.875rem" }}>{ord.call_title}</td>
                    <td style={{ padding: "12px", fontSize: "0.875rem" }}>{ord.period}</td>
                    <td style={{ padding: "12px", fontWeight: "700", color: "var(--brand)" }}>
                      ${ord.amount.toLocaleString("es-MX")}
                    </td>
                    <td style={{ padding: "12px", fontSize: "0.8125rem" }}>{date(ord.scheduled_date)}</td>
                    <td style={{ padding: "12px", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                      {ord.reference}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span className="badge badge-validado">{ord.status}</span>
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
        <Modal title="Emitir Orden de Cobro Institucional" onClose={() => setShowGenerateModal(false)}>
          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Alert>{errorMsg}</Alert>

            <div className="field">
              <label htmlFor="appSelect">Beca aprobada del aspirante *</label>
              <select
                id="appSelect"
                required
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                style={{ padding: "8px" }}
              >
                <option value="">Selecciona una beca aprobada…</option>
                {(approvedApps || []).map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.folio} - {app.applicant.name} ({app.call_title})
                  </option>
                ))}
              </select>
            </div>

            <Field
              label="Periodo / Parcial a dispersar"
              required
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Ej. Primer Parcial - Mayo 2026"
            />

            <Field
              label="Fecha programada de pago"
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
                Confirmar y foliar orden de cobro
              </BusyButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
