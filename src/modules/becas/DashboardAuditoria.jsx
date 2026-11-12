import { useState } from "react";
import {
  BarChart3,
  Download,
  Shield,
  FileSpreadsheet,
  Lock,
  UserCheck,
  TrendingUp,
  Activity,
  History,
} from "lucide-react";
import { api, date } from "../../shared/api";
import { useAuth } from "../../app/Auth";
import { Alert, useAsync } from "../../shared/ui";
import { MODALIDADES } from "../../../shared/becas";

export default function DashboardAuditoria() {
  const { user } = useAuth();
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [simulatingExport, setSimulatingExport] = useState("");

  const { data: stats, loading: loadingStats, error: statsError } = useAsync(
    () => api("/becas/estadisticas"),
    []
  );

  const { data: auditLogs, loading: loadingAudit, error: auditError } = useAsync(
    () => (["administrador", "auditor", "escolares"].includes(user.role) ? api("/becas/auditoria") : Promise.resolve([])),
    []
  );

  const { data: padron, loading: loadingPadron } = useAsync(
    () => api("/becas/padron-beneficiarios"),
    []
  );

  function handleExportPadron() {
    if (!padron || padron.length === 0) return;
    const headers = ["Folio", "Estudiante", "Correo", "Carrera", "Cuatrimestre", "Promedio", "Convocatoria", "Modalidad", "Monto", "Estado", "Banco", "CLABE"];
    const rows = padron.map((b) => [
      b.folio,
      `"${b.student_name}"`,
      b.student_email,
      `"${b.major}"`,
      `"${b.academic_term}"`,
      b.gpa,
      `"${b.call_title}"`,
      b.modalidad,
      b.amount,
      b.status,
      `"${b.bank_name}"`,
      b.clabe_masked,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `padron_oficial_becarios_uto_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleCsvExport() {
    setDownloadingCsv(true);
    window.location.href = "/api/v1/becas/reportes/export";
    setTimeout(() => setDownloadingCsv(false), 1500);
  }

  function handleSimulatedExport(type) {
    setSimulatingExport(type);
    setTimeout(() => {
      setSimulatingExport("");
      alert(
        `Generación de reporte ${type.toUpperCase()} completada para demostración institucional. Para datos crudos en vivo, utiliza la descarga oficial en CSV.`
      );
    }, 800);
  }

  return (
    <div>
      <header style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 4px 0", fontSize: "1.25rem", color: "var(--brand)" }}>
          Tablero de Control, Reportes y Seguridad Institucional
        </h2>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
          Métricas de postulantes, montos comprometidos, descarga de reportes, matriz de permisos y trazabilidad de cambios para auditoría.
        </p>
      </header>

      {statsError && <Alert>{statsError}</Alert>}
      {loadingStats && <p>Cargando indicadores en tiempo real…</p>}

      {/* KPI Cards */}
      {stats && (
        <div className="becas-stats-grid">
          <div className="stat-card">
            <span className="stat-card-label">Total de postulantes</span>
            <span className="stat-card-value">{stats.total_applications}</span>
            <span className="stat-card-sub">Expedientes registrados</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Becas otorgadas</span>
            <span className="stat-card-value" style={{ color: "var(--green)" }}>
              {stats.approved}
            </span>
            <span className="stat-card-sub">Tasa de aprobación: {stats.approval_rate}%</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Inversión institucional</span>
            <span className="stat-card-value">${stats.total_committed_funds.toLocaleString("es-MX")}</span>
            <span className="stat-card-sub">Recursos comprometidos UTO</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Promedio general</span>
            <span className="stat-card-value" style={{ color: "var(--gold)" }}>
              {stats.average_gpa.toFixed(2)}
            </span>
            <span className="stat-card-sub">Aspirantes evaluados</span>
          </div>
        </div>
      )}

      {/* Gráficas / Barras de distribución por modalidad y estado */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
          {/* Modalidad */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              padding: "16px",
              borderRadius: "var(--radius)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", color: "var(--brand)" }}>
              <BarChart3 size={18} />
              <h3 style={{ margin: 0, fontSize: "1rem" }}>Distribución por modalidad de beca</h3>
            </div>
            {MODALIDADES.map((m) => {
              const count = stats.by_modality[m.id] || 0;
              const pct = stats.total_applications > 0 ? (count / stats.total_applications) * 100 : 0;
              return (
                <div key={m.id} className="chart-bar-container">
                  <span className="chart-label">{m.name}</span>
                  <div className="chart-track">
                    <div className="chart-bar" style={{ width: `${Math.max(4, pct)}%` }} />
                  </div>
                  <span className="chart-value">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Estado de solicitudes */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              padding: "16px",
              borderRadius: "var(--radius)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", color: "var(--brand)" }}>
              <TrendingUp size={18} />
              <h3 style={{ margin: 0, fontSize: "1rem" }}>Estado de dictaminación de solicitudes</h3>
            </div>
            {[
              { label: "Aprobadas", count: stats.approved, color: "var(--green)" },
              { label: "En revisión por comité", count: stats.in_review, color: "var(--gold)" },
              { label: "Recibidas (pendientes)", count: stats.received, color: "var(--brand)" },
              { label: "Rechazadas", count: stats.rejected, color: "var(--error)" },
            ].map((item) => {
              const pct = stats.total_applications > 0 ? (item.count / stats.total_applications) * 100 : 0;
              return (
                <div key={item.label} className="chart-bar-container">
                  <span className="chart-label">{item.label}</span>
                  <div className="chart-track">
                    <div className="chart-bar" style={{ width: `${Math.max(4, pct)}%`, background: item.color }} />
                  </div>
                  <span className="chart-value">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exportación de reportes */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          padding: "20px",
          borderRadius: "var(--radius)",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "var(--brand)" }}>
          <Download size={20} />
          <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Exportación oficial de reportes y concentrados</h3>
        </div>
        <p style={{ margin: "0 0 16px 0", fontSize: "0.875rem", color: "var(--muted)" }}>
          Descarga las relaciones completas de becarios, montos, promedios e índices de vulnerabilidad para auditoría institucional o entrega a Rectoría.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="button button-primary"
            onClick={handleCsvExport}
            disabled={downloadingCsv}
          >
            <Download size={16} /> {downloadingCsv ? "Generando CSV…" : "Descargar reporte completo en CSV"}
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => handleSimulatedExport("excel")}
          >
            <FileSpreadsheet size={16} /> Descargar plantilla Excel (.xlsx)
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => handleSimulatedExport("pdf")}
          >
            Generar resumen ejecutivo en PDF
          </button>
        </div>
      </section>

      {/* Matriz de Seguridad y Roles */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          padding: "20px",
          borderRadius: "var(--radius)",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "var(--brand)" }}>
          <Shield size={20} />
          <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Seguridad, Roles y Control de Acceso</h3>
        </div>
        <p style={{ margin: "0 0 16px 0", fontSize: "0.875rem", color: "var(--muted)" }}>
          El módulo de becas implementa aislamiento estricto de privilegios y preparación para autenticación multifactor (2FA).
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          <div style={{ background: "var(--canvas)", padding: "12px", borderRadius: "var(--radius)" }}>
            <strong>Estudiante</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
              Registro personal, postulación única por convocatoria, estudio socioeconómico y seguimiento.
            </p>
          </div>
          <div style={{ background: "var(--canvas)", padding: "12px", borderRadius: "var(--radius)" }}>
            <strong>Comité Evaluador</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
              Revisión de expedientes, ejecución del motor de reglas, emisión de dictamen y votación.
            </p>
          </div>
          <div style={{ background: "var(--canvas)", padding: "12px", borderRadius: "var(--radius)" }}>
            <strong>Administrador</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
              Apertura y cierre de convocatorias, gestor de preguntas, calendario de órdenes de cobro.
            </p>
          </div>
          <div style={{ background: "var(--canvas)", padding: "12px", borderRadius: "var(--radius)" }}>
            <strong>Auditor Institucional</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
              Consulta en tiempo real de logs de auditoría, exportaciones masivas y trazabilidad anti-fraude.
            </p>
          </div>
        </div>
      </section>

      {/* Padrón Oficial de Beneficiarios */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          padding: "20px",
          borderRadius: "var(--radius)",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--brand)" }}>
              <UserCheck size={20} />
              <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Padrón Oficial de Beneficiarios (Becas Otorgadas)</h3>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "var(--muted)" }}>
              Relación nominal de estudiantes con dictamen favorable para entrega a Tesorería y Contraloría Universitaria.
            </p>
          </div>
          <button
            type="button"
            className="button button-primary"
            style={{ fontSize: "0.8125rem" }}
            onClick={handleExportPadron}
            disabled={!padron || padron.length === 0}
          >
            <Download size={14} /> Descargar Padrón Oficial (CSV)
          </button>
        </div>

        {loadingPadron && <p>Cargando padrón oficial…</p>}

        {padron && (
          <div className="audit-table-wrapper">
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--canvas)", textAlign: "left", fontSize: "0.8125rem" }}>
                  <th style={{ padding: "10px 12px" }}>Folio Beca</th>
                  <th style={{ padding: "10px 12px" }}>Estudiante</th>
                  <th style={{ padding: "10px 12px" }}>Carrera</th>
                  <th style={{ padding: "10px 12px" }}>Promedio</th>
                  <th style={{ padding: "10px 12px" }}>Convocatoria</th>
                  <th style={{ padding: "10px 12px" }}>Monto</th>
                  <th style={{ padding: "10px 12px" }}>Datos Bancarios</th>
                  <th style={{ padding: "10px 12px" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {padron.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                      Aún no hay becas con dictamen favorable en el padrón institucional.
                    </td>
                  </tr>
                ) : (
                  padron.map((b) => (
                    <tr key={b.id} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ padding: "10px 12px", fontWeight: "700" }}>{b.folio}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: "600", fontSize: "0.875rem" }}>{b.student_name}</div>
                        <small style={{ color: "var(--muted)" }}>{b.student_email}</small>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "0.8125rem" }}>{b.major} ({b.academic_term})</td>
                      <td style={{ padding: "10px 12px", fontWeight: "700" }}>{b.gpa.toFixed(1)}</td>
                      <td style={{ padding: "10px 12px", fontSize: "0.8125rem" }}>{b.call_title}</td>
                      <td style={{ padding: "10px 12px", fontWeight: "700", color: "var(--brand)" }}>
                        ${b.amount.toLocaleString("es-MX")}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "0.8125rem" }}>
                        {b.has_bank_clabe ? (
                          <span><strong>{b.bank_name}</strong> ({b.clabe_masked})</span>
                        ) : (
                          <span style={{ color: "var(--error)" }}>Pendiente de CLABE</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span className="badge badge-validado">{b.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Historial de Auditoría (Logs) */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "var(--brand)" }}>
          <History size={20} />
          <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Bitácora de Auditoría y Trazabilidad (Logs del Sistema)</h3>
        </div>
        <p style={{ margin: "0 0 16px 0", fontSize: "0.875rem", color: "var(--muted)" }}>
          Registro cronológico inmutable de qué usuario realizó qué cambio y en qué momento para prevenir fraudes.
        </p>

        {auditError && <Alert>{auditError}</Alert>}
        {loadingAudit && <p>Cargando bitácora de eventos…</p>}

        {auditLogs && (
          <div className="audit-table-wrapper">
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--canvas)", textAlign: "left", fontSize: "0.8125rem" }}>
                  <th style={{ padding: "10px 12px" }}>Fecha y hora</th>
                  <th style={{ padding: "10px 12px" }}>Acción registrada</th>
                  <th style={{ padding: "10px 12px" }}>Usuario actor</th>
                  <th style={{ padding: "10px 12px" }}>Entidad</th>
                  <th style={{ padding: "10px 12px" }}>Detalles del cambio</th>
                  <th style={{ padding: "10px 12px" }}>Dirección IP</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                      No se registran eventos recientes en la bitácora.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ padding: "10px 12px", fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
                        {date(log.created_at, true)}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: "600", fontSize: "0.875rem" }}>
                        {log.action}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: "600" }}>{log.user_name}</div>
                        <small style={{ color: "var(--muted)" }}>{log.user_email}</small>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "0.8125rem", color: "var(--muted)" }}>
                        {log.target_type} #{log.target_id}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "0.8125rem" }}>{log.details}</td>
                      <td style={{ padding: "10px 12px", fontSize: "0.8125rem", fontFamily: "monospace" }}>
                        {log.ip_address}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
