import { lazy } from "react";
import { Route } from "react-router-dom";
import RoleRoute from "../../app/RoleRoute";
import { useAuth } from "../../app/Auth";

const Layout = lazy(() => import("./Layout"));
const Admin = lazy(() => import("./Admin"));
const Results = lazy(() => import("./Results"));
const Questionnaires = lazy(() => import("./Questionnaires"));
const Student = lazy(() => import("./Student"));
const AnswerSelfEvaluation = lazy(() =>
  import("./Student").then((m) => ({ default: m.AnswerSelfEvaluation }))
);
const StudentHistory = lazy(() =>
  import("./Student").then((m) => ({ default: m.StudentHistory }))
);

const admin = (children) => (
  <RoleRoute roles={["administrador"]}>
    {children}
  </RoleRoute>
);

const student = (children) => (
  <RoleRoute roles={["estudiante"]}>
    {children}
  </RoleRoute>
);

// Determina qué pantalla inicial mostrar según el rol.
function Entry() {
  const { user } = useAuth();

  return user.role === "administrador"
    ? <Admin />
    : <Student />;
}

export const selfEvaluationRoutes = (
  <Route
    path="autoevaluacion"
    element={
      <RoleRoute roles={["administrador", "estudiante"]}>
        <Layout />
      </RoleRoute>
    }
  >
    <Route index element={<Entry />} />

    {/* Rutas del administrador */}
    <Route
      path="cuestionarios"
      element={admin(<Questionnaires />)}
    />
    <Route
      path="evaluaciones"
      element={admin(<Admin />)}
    />
    <Route
      path="resultados/:id"
      element={admin(<Results />)}
    />

    {/* Rutas del estudiante */}
    <Route
      path="mis-evaluaciones"
      element={student(<Student />)}
    />
    <Route
      path="evaluar/:id"
      element={student(<AnswerSelfEvaluation />)}
    />
    <Route
      path="historial"
      element={student(<StudentHistory />)}
    />
  </Route>
);
