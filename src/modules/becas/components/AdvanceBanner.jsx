import { Layers, ShieldAlert, Sparkles } from "lucide-react";

export default function AdvanceBanner() {
  return (
    <aside className="advance-banner" role="region" aria-label="Estado de avance del módulo">
      <div className="advance-banner-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={18} color="var(--brand)" />
          <strong>Módulo de Gestión de Becas UTO</strong>
        </div>
        <span className="advance-tag">Avance de entrega: 55% - 60%</span>
      </div>
      <p>
        <strong>Fase 1 completada para validación y avance:</strong> Catálogo y buscador de convocatorias, solicitud digital con carga de documentos (PDF/JPG), estudio socioeconómico digital con cálculo de vulnerabilidad, panel de dictaminación con motor de reglas automáticas (descarte por promedio mínimo), calendario de órdenes de cobro, módulo de renovación y tablero de estadísticas con bitácora de auditoría.
      </p>
      <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "4px" }}>
        <em>Pendientes institucionales para Fase 2 (100%):</em> Conexión a pasarela bancaria SPEI para dispersión automática, firma electrónica con SAT/e.firma y vinculación directa al padrón estatal de becas.
      </p>
    </aside>
  );
}
