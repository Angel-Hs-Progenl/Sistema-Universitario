
import { lazy, Suspense } from "react";
import {
  Routes,
  Route,
  Link,
  Navigate
} from "react-router-dom";

import { AuthProvider, Protected, useAuth } from "./Auth";
import Shell from "./Shell";
import { NavigationProvider } from "./Navigation";

import Home from "../modules/home/Home";
import Login, { Recover } from "../modules/auth/Login";
import {
  Help,
  Privacy,
  Notifications
} from "../modules/home/Information";

// ========================================
// MÓDULO DE TITULACIÓN
// ========================================

const TitleLayout = lazy(() =>
  import("../modules/titulacion/Layout")
);

const Workspace = lazy(() =>
  import("../modules/titulacion/Workspace")
);

const Profile = lazy(() =>
  import("../modules/titulacion/Profile")
);

const Account = lazy(() =>
  import("../modules/auth/Account")
);

// ========================================
// MÓDULO DE BECAS
// ========================================

const BecasLayout = lazy(() =>
  import("../modules/becas/Layout")
);

const Convocatorias = lazy(() =>
  import("../modules/becas/Convocatorias")
);

const Solicitudes = lazy(() =>
  import("../modules/becas/Solicitudes")
);

const EstudioSocioeconomico = lazy(() =>
  import("../modules/becas/EstudioSocioeconomico")
);

const AdminConvocatorias = lazy(() =>
  import("../modules/becas/AdminConvocatorias")
);

const PanelDictaminacion = lazy(() =>
  import("../modules/becas/PanelDictaminacion")
);

const OrdenesCobro = lazy(() =>
  import("../modules/becas/OrdenesCobro")
);

const Renovaciones = lazy(() =>
  import("../modules/becas/Renovaciones")
);

const DashboardAuditoria = lazy(() =>
  import("../modules/becas/DashboardAuditoria")
);

// ========================================
// EVALUACIÓN DOCENTE - ESTUDIANTE
// ========================================

const LayoutEstudiante = lazy(() =>
  import("../modules/evaluacion-docente/estudiantes/LayoutEstudiante")
);

const DashEstudiante = lazy(() =>
  import("../modules/evaluacion-docente/estudiantes/DashEstudiante")
);

const MisEvaluaciones = lazy(() =>
  import("../modules/evaluacion-docente/estudiantes/MisEvaluaciones")
);

const EvaluarDocente = lazy(() =>
  import("../modules/evaluacion-docente/estudiantes/EvaluarDocente")
);

const PerfilEstudiante = lazy(() =>
  import("../modules/evaluacion-docente/estudiantes/Perfil")
);

// ========================================
// EVALUACIÓN DOCENTE - DOCENTE
// ========================================

const LayoutDocente = lazy(() =>
  import("../modules/evaluacion-docente/docente/LayoutDocente")
);

const DashDocente = lazy(() =>
  import("../modules/evaluacion-docente/docente/DashDocente")
);

const ResultadosDocente = lazy(() =>
  import("../modules/evaluacion-docente/docente/ResultadosDocente")
);

const ComentariosDocente = lazy(() =>
  import("../modules/evaluacion-docente/docente/ComentariosDocente")
);

const ReporteDocente = lazy(() =>
  import("../modules/evaluacion-docente/docente/ReporteDocente")
);

const PerfilDocente = lazy(() =>
  import("../modules/evaluacion-docente/docente/PerfilDocente")
);

const AyudaDocente = lazy(() =>
  import("../modules/evaluacion-docente/docente/AyudaDocente")
);

const AsignaturasDocente = lazy(() =>
  import("../modules/evaluacion-docente/docente/AsignaturasDocente")
);

// ========================================
// EVALUACIÓN DOCENTE - DIRECCIÓN
// ========================================

const LayoutDireccion = lazy(() =>
  import("../modules/evaluacion-docente/direccion/LayoutDireccion")
);

const DashDireccion = lazy(() =>
  import("../modules/evaluacion-docente/direccion/DashDireccion")
);

const DocentesDireccion = lazy(() =>
  import("../modules/evaluacion-docente/direccion/DocentesDireccion")
);

const EstudiantesDireccion = lazy(() =>
  import("../modules/evaluacion-docente/direccion/EstudiantesDireccion")
);

const GruposAsignaturas = lazy(() =>
  import("../modules/evaluacion-docente/direccion/GruposAsignaturas")
);

const PeriodosDireccion = lazy(() =>
  import("../modules/evaluacion-docente/direccion/PeriodosDireccion")
);

const CuestionariosDireccion = lazy(() =>
  import("../modules/evaluacion-docente/direccion/CuestionariosDireccion")
);

const ResultadosDireccion = lazy(() =>
  import("../modules/evaluacion-docente/direccion/ResultadosDireccion")
);

const ReportesDireccion = lazy(() =>
  import("../modules/evaluacion-docente/direccion/ReportesDireccion")
);

const PlanesAccion = lazy(() =>
  import("../modules/evaluacion-docente/direccion/PlanesAccion")
);

// ========================================
// ENTRADA SEGÚN EL ROL DEL PORTAL
// ========================================

function EntradaEvaluacion() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/acceso" replace />;
  }

  if (user.role === "estudiante") {
    return (
      <Navigate
        to="/evaluacion-docente/estudiante"
        replace
      />
    );
  }

  if (user.role === "docente") {
    return (
      <Navigate
        to="/evaluacion-docente/docente"
        replace
      />
    );
  }

  if (user.role === "administrador") {
    return (
      <Navigate
        to="/evaluacion-docente/direccion"
        replace
      />
    );
  }

  return <Navigate to="/" replace />;
}

// ========================================
// PROTECCIÓN DE RUTAS POR ROL
// ========================================

function SoloRol({ roles, children }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ========================================
// APLICACIÓN PRINCIPAL
// ========================================

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>

        <Suspense
          fallback={
            <div className="container narrow-page">
              <p>Cargando módulo...</p>
            </div>
          }
        >
          <Routes>

            <Route element={<Shell />}>

              {/* INICIO DEL PORTAL */}
              <Route
                index
                element={
                  <Protected>
                    <Home />
                  </Protected>
                }
              />

              {/* AUTENTICACIÓN */}
              <Route
                path="acceso"
                element={<Login />}
              />

              <Route
                path="recuperar"
                element={<Recover />}
              />

              <Route
                path="cuenta"
                element={
                  <Protected>
                    <Account />
                  </Protected>
                }
              />

              {/* INFORMACIÓN GENERAL */}
              <Route
                path="ayuda"
                element={<Help />}
              />

              <Route
                path="privacidad"
                element={<Privacy />}
              />

              <Route
                path="notificaciones"
                element={
                  <Protected>
                    <Notifications />
                  </Protected>
                }
              />

              {/* ================================= */}
              {/* TITULACIÓN */}
              {/* ================================= */}

              <Route
                path="titulacion"
                element={
                  <Protected>
                    <TitleLayout />
                  </Protected>
                }
              >
                <Route
                  index
                  element={<Workspace />}
                />

                <Route
                  path="perfil"
                  element={<Profile />}
                />

                <Route
                  path="documentos"
                  element={<Workspace />}
                />

                <Route
                  path="seguimiento"
                  element={<Workspace />}
                />

                <Route
                  path="expediente/:id"
                  element={<Workspace />}
                />
              </Route>

              {/* ================================= */}
              {/* BECAS */}
              {/* ================================= */}

              <Route
                path="becas"
                element={
                  <Protected>
                    <BecasLayout />
                  </Protected>
                }
              >
                <Route
                  index
                  element={<Convocatorias />}
                />

                <Route
                  path="solicitudes"
                  element={<Solicitudes />}
                />

                <Route
                  path="socioeconomico"
                  element={<EstudioSocioeconomico />}
                />

                <Route
                  path="admin-convocatorias"
                  element={<AdminConvocatorias />}
                />

                <Route
                  path="dictamen"
                  element={<PanelDictaminacion />}
                />

                <Route
                  path="ordenes-cobro"
                  element={<OrdenesCobro />}
                />

                <Route
                  path="renovacion"
                  element={<Renovaciones />}
                />

                <Route
                  path="dashboard"
                  element={<DashboardAuditoria />}
                />
              </Route>

              {/* ================================= */}
              {/* EVALUACIÓN DOCENTE */}
              {/* ================================= */}

              <Route
                path="evaluacion-docente"
                element={
                  <Protected>
                    <EntradaEvaluacion />
                  </Protected>
                }
              />

              {/* ================================= */}
              {/* ROL ESTUDIANTE */}
              {/* ================================= */}

              <Route
                path="evaluacion-docente/estudiante"
                element={
                  <Protected>
                    <SoloRol roles={["estudiante"]}>
                      <LayoutEstudiante />
                    </SoloRol>
                  </Protected>
                }
              >
                <Route
                  index
                  element={<DashEstudiante />}
                />

                <Route
                  path="mis-evaluaciones"
                  element={<MisEvaluaciones />}
                />

                <Route
                  path="evaluar/:id"
                  element={<EvaluarDocente />}
                />

                <Route
                  path="perfil"
                  element={<PerfilEstudiante />}
                />
              </Route>

              {/* ================================= */}
              {/* ROL DOCENTE */}
              {/* ================================= */}

              <Route
                path="evaluacion-docente/docente"
                element={
                  <Protected>
                    <SoloRol roles={["docente"]}>
                      <LayoutDocente />
                    </SoloRol>
                  </Protected>
                }
              >
                <Route
                  index
                  element={<DashDocente />}
                />

                <Route
                  path="resultados"
                  element={<ResultadosDocente />}
                />

                <Route
                  path="comentarios"
                  element={<ComentariosDocente />}
                />

                <Route
                  path="reporte"
                  element={<ReporteDocente />}
                />

                <Route
                  path="perfil"
                  element={<PerfilDocente />}
                />

                <Route
                  path="ayuda"
                  element={<AyudaDocente />}
                />

                <Route
                  path="asignaturas"
                  element={<AsignaturasDocente />}
                />
              </Route>

              {/* ================================= */}
              {/* ROL DIRECCIÓN ACADÉMICA */}
              {/* ================================= */}

              <Route
                path="evaluacion-docente/direccion"
                element={
                  <Protected>
                    <SoloRol roles={["administrador"]}>
                      <LayoutDireccion />
                    </SoloRol>
                  </Protected>
                }
              >
                <Route
                  index
                  element={<DashDireccion />}
                />

                <Route
                  path="docentes"
                  element={<DocentesDireccion />}
                />

                <Route
                  path="estudiantes"
                  element={<EstudiantesDireccion />}
                />

                <Route
                  path="grupos"
                  element={<GruposAsignaturas />}
                />

                <Route
                  path="periodos"
                  element={<PeriodosDireccion />}
                />

                <Route
                  path="cuestionarios"
                  element={<CuestionariosDireccion />}
                />

                <Route
                  path="resultados"
                  element={<ResultadosDireccion />}
                />

                <Route
                  path="reportes"
                  element={<ReportesDireccion />}
                />

                <Route
                  path="planes-accion"
                  element={<PlanesAccion />}
                />
              </Route>

              {/* ================================= */}
              {/* PÁGINA NO ENCONTRADA */}
              {/* ================================= */}

              <Route
                path="*"
                element={
                  <div className="container narrow-page">
                    <span className="eyebrow">404</span>

                    <h1>Página no encontrada</h1>

                    <p>
                      Vuelve al inicio para encontrar
                      el servicio que necesitas.
                    </p>

                    <Link
                      className="button button-primary"
                      to="/"
                    >
                      Volver al inicio
                    </Link>
                  </div>
                }
              />

            </Route>

          </Routes>
        </Suspense>

      </NavigationProvider>
    </AuthProvider>
  );
}
