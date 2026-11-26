import { lazy } from "react";
import { Route } from "react-router-dom";
import RoleRoute from "../../app/RoleRoute";
import { useAuth } from "../../app/Auth";

const Layout = lazy(() => import("./Layout"));
const Student = lazy(() => import("./Student"));
const Response = lazy(() => import("./Response"));
const Admin = lazy(() => import("./Admin"));
const Questionnaires = lazy(() => import("./Questionnaires"));

function Entry() {
  const { user } = useAuth();
  return user.role === "administrador" ? <Admin /> : <Student />;
}

export const peerEvaluationRoutes = (
  <Route
    path="coevaluacion"
    element={
      <RoleRoute roles={["estudiante", "administrador"]}>
        <Layout />
      </RoleRoute>
    }
  >
    <Route index element={<Entry />} />
    <Route
      path="mis-asignaciones"
      element={
        <RoleRoute roles={["estudiante"]}>
          <Student />
        </RoleRoute>
      }
    />
    <Route
      path="responder/:id"
      element={
        <RoleRoute roles={["estudiante"]}>
          <Response />
        </RoleRoute>
      }
    />
    <Route
      path="actividades"
      element={
        <RoleRoute roles={["administrador"]}>
          <Admin />
        </RoleRoute>
      }
    />
    <Route
      path="cuestionarios"
      element={
        <RoleRoute roles={["administrador"]}>
          <Questionnaires />
        </RoleRoute>
      }
    />
  </Route>
);
