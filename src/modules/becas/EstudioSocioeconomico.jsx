import { useState, useEffect } from "react";
import {
  DollarSign,
  Home,
  Users,
  FileCheck,
  CheckCircle,
  HelpCircle,
  TrendingDown,
} from "lucide-react";
import { api } from "../../shared/api";
import { Field, BusyButton, Alert, useAsync } from "../../shared/ui";
import { calculateVulnerabilityScore } from "../../../shared/becas";

export default function EstudioSocioeconomico() {
  const [income, setIncome] = useState(6000);
  const [expenses, setExpenses] = useState(5500);
  const [dependents, setDependents] = useState(3);
  const [housingType, setHousingType] = useState("rentada");

  // Detailed fields
  const [rooms, setRooms] = useState(2);
  const [wallMaterial, setWallMaterial] = useState("tabique");
  const [hasWater, setHasWater] = useState(true);
  const [hasElectricity, setHasElectricity] = useState(true);
  const [hasInternet, setHasInternet] = useState(true);
  const [jobDescription, setJobDescription] = useState("Comercio o empleo eventual");
  const [vulnerabilityReason, setVulnerabilityReason] = useState("");

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: profile, loading, error, refresh } = useAsync(
    () => api("/becas/socioeconomico"),
    []
  );

  useEffect(() => {
    if (profile?.has_profile) {
      setIncome(profile.monthly_income || 0);
      setExpenses(profile.monthly_expenses || 0);
      setDependents(profile.dependents_count || 1);
      setHousingType(profile.housing_type || "propia");
      if (profile.details) {
        setRooms(profile.details.rooms || 2);
        setWallMaterial(profile.details.wallMaterial || "tabique");
        setHasWater(profile.details.hasWater ?? true);
        setHasElectricity(profile.details.hasElectricity ?? true);
        setHasInternet(profile.details.hasInternet ?? true);
        setJobDescription(profile.details.jobDescription || "");
        setVulnerabilityReason(profile.details.vulnerabilityReason || "");
      }
    }
  }, [profile]);

  const liveScore = calculateVulnerabilityScore({
    monthlyIncome: parseFloat(income) || 0,
    monthlyExpenses: parseFloat(expenses) || 0,
    dependentsCount: parseInt(dependents, 10) || 1,
    housingType,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await api("/becas/socioeconomico", {
        method: "POST",
        body: {
          monthly_income: parseFloat(income) || 0,
          monthly_expenses: parseFloat(expenses) || 0,
          dependents_count: parseInt(dependents, 10) || 1,
          housing_type: housingType,
          details: {
            rooms: parseInt(rooms, 10) || 1,
            wallMaterial,
            hasWater,
            hasElectricity,
            hasInternet,
            jobDescription,
            vulnerabilityReason,
          },
        },
      });
      setSuccessMsg(res.message);
      refresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      <header style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 6px 0", fontSize: "1.375rem", color: "var(--brand)" }}>
          Estudio Socioeconómico Digital UTO
        </h2>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
          Declaración bajo protesta de decir verdad de ingresos, egresos, características de vivienda y personas dependientes del núcleo familiar.
        </p>
      </header>

      {/* Indicador de vulnerabilidad en tiempo real */}
      <div className="socio-score-meter">
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--muted)", fontWeight: "600" }}>
            Índice de vulnerabilidad estimado
          </span>
          <div className="socio-score-number">{liveScore} pts</div>
        </div>
        <div style={{ flexGrow: 1 }}>
          <div className="score-bar-bg">
            <div className="score-bar-fill" style={{ width: `${liveScore}%` }} />
          </div>
          <small style={{ color: "var(--muted)", marginTop: "4px", display: "block" }}>
            {liveScore >= 70
              ? "Prioridad alta para becas de manutención, transporte o alimentación."
              : liveScore >= 50
              ? "Vulnerabilidad media. Cumple con los criterios socioeconómicos básicos."
              : "Vulnerabilidad baja. Recomendable postularse a modalidades de Excelencia Académica."}
          </small>
        </div>
      </div>

      {successMsg && (
        <div className="alert success" style={{ marginBottom: "16px" }}>
          <CheckCircle size={18} />
          <div>{successMsg}</div>
        </div>
      )}
      {errorMsg && <Alert>{errorMsg}</Alert>}
      {loading && <p>Cargando información guardada…</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Sección 1: Ingresos y Egresos */}
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            padding: "20px",
            borderRadius: "var(--radius)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--brand)" }}>
            <DollarSign size={20} />
            <h3 style={{ margin: 0, fontSize: "1.125rem" }}>1. Ingresos y Egresos Familiares Mensuales</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field
              label="Ingreso familiar mensual neto ($ MXN)"
              type="number"
              step="100"
              min="0"
              required
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              hint="Suma de aportaciones de todos los integrantes que laboran."
            />
            <Field
              label="Gasto familiar mensual estimado ($ MXN)"
              type="number"
              step="100"
              min="0"
              required
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
              hint="Alimentación, renta, transporte, servicios, salud y escuela."
            />
          </div>

          <Field
            label="Principal actividad u ocupación económica del sostén familiar"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Ej. Jornalero agrícola, obrero textil, empleado de mostrador, comerciante…"
          />
        </section>

        {/* Sección 2: Composición familiar */}
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            padding: "20px",
            borderRadius: "var(--radius)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--brand)" }}>
            <Users size={20} />
            <h3 style={{ margin: 0, fontSize: "1.125rem" }}>2. Composición Familiar y Dependientes</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field
              label="Número total de dependientes económicos"
              type="number"
              min="1"
              max="20"
              required
              value={dependents}
              onChange={(e) => setDependents(e.target.value)}
              hint="Personas que dependen del ingreso declarado (incluyéndote a ti)."
            />
            <div className="field">
              <label htmlFor="housingTypeSelect">Régimen de la vivienda</label>
              <select
                id="housingTypeSelect"
                value={housingType}
                onChange={(e) => setHousingType(e.target.value)}
                style={{ padding: "8px" }}
              >
                <option value="propia">Propia (pagada o en proceso)</option>
                <option value="rentada">Rentada</option>
                <option value="prestada">Prestada / Familiar</option>
                <option value="otra">Otra situación</option>
              </select>
              <small>El tipo de tenencia influye en el cálculo del índice de vulnerabilidad.</small>
            </div>
          </div>
        </section>

        {/* Sección 3: Características de la vivienda */}
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            padding: "20px",
            borderRadius: "var(--radius)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--brand)" }}>
            <Home size={20} />
            <h3 style={{ margin: 0, fontSize: "1.125rem" }}>3. Características del Hogar y Servicios</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <Field
              label="Número de habitaciones / cuartos"
              type="number"
              min="1"
              max="15"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
            />
            <div className="field">
              <label htmlFor="wallMaterialSelect">Material predominante en muros</label>
              <select
                id="wallMaterialSelect"
                value={wallMaterial}
                onChange={(e) => setWallMaterial(e.target.value)}
                style={{ padding: "8px" }}
              >
                <option value="tabique">Tabique, block o concreto</option>
                <option value="adobe">Adobe o bajareque</option>
                <option value="madera">Madera o lámina</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Servicios disponibles:</label>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={hasWater}
                  onChange={(e) => setHasWater(e.target.checked)}
                />
                Agua potable entubada
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={hasElectricity}
                  onChange={(e) => setHasElectricity(e.target.checked)}
                />
                Energía eléctrica
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={hasInternet}
                  onChange={(e) => setHasInternet(e.target.checked)}
                />
                Conexión a Internet en casa
              </label>
            </div>
          </div>
        </section>

        {/* Sección 4: Vulnerabilidad especial */}
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            padding: "20px",
            borderRadius: "var(--radius)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--brand)" }}>
            <FileCheck size={20} />
            <h3 style={{ margin: 0, fontSize: "1.125rem" }}>4. Situación de Vulnerabilidad o Consideraciones Especiales</h3>
          </div>

          <Field
            as="textarea"
            rows={3}
            label="Detalla si enfrentas alguna situación particular (enfermedad crónica familiar, discapacidad, orfandad, lejanía geográfica)"
            value={vulnerabilityReason}
            onChange={(e) => setVulnerabilityReason(e.target.value)}
            placeholder="Información adicional que deba conocer el Comité de Becas para la ponderación de tu expediente…"
          />
        </section>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <BusyButton busy={saving} busyText="Guardando estudio…" type="submit" className="button button-primary">
            Guardar estudio socioeconómico
          </BusyButton>
        </div>
      </form>
    </div>
  );
}
