import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import { useAuth } from "../../app/Auth";
import RoleRoute from "../../app/RoleRoute";
import { MODULES } from "../../../shared/navigation";
const Layout = lazy(() => import("./Layout"));
const Calls = lazy(() => import("./Calls"));
const Applications = lazy(() => import("./Solicitudes"));
const Review = lazy(() => import("./PanelDictaminacion"));
const Case = lazy(() =>
  import("./Applications").then((m) => ({ default: m.ScholarshipCase })),
);
const Socioeconomic = lazy(() => import("./EstudioSocioeconomico"));
const Manage = lazy(() => import("./AdminConvocatorias"));
const Orders = lazy(() => import("./OrdenesCobro"));
const Renewals = lazy(() => import("./Renovaciones"));
const Activity = lazy(() => import("./DashboardAuditoria"));
const REVIEW = ["administrador", "escolares", "evaluador"];
const REPORT = [...REVIEW, "auditor"];
const allowed = (roles, content) => (
  <RoleRoute roles={roles}>{content}</RoleRoute>
);
function Entry() {
  const { user } = useAuth();
  return user.role === "tesoreria" ? (
    <Navigate to="ordenes-cobro" replace />
  ) : user.role === "auditor" ? (
    <Navigate to="dashboard" replace />
  ) : (
    <Calls />
  );
}
export const scholarshipRoutes = (
  <Route
    path="becas"
    element={allowed(MODULES.find((m) => m.id === "becas").roles, <Layout />)}
  >
    <Route index element={<Entry />} />
    <Route
      path="solicitudes"
      element={allowed(["estudiante"], <Applications />)}
    />
    <Route
      path="solicitud/:id"
      element={allowed(["estudiante", ...REVIEW], <Case />)}
    />
    <Route
      path="socioeconomico"
      element={allowed(["estudiante"], <Socioeconomic />)}
    />
    <Route path="admin-convocatorias" element={allowed(REVIEW, <Manage />)} />
    <Route path="dictamen" element={allowed(REVIEW, <Review />)} />
    <Route path="ordenes-cobro" element={<Orders />} />
    <Route
      path="renovacion"
      element={allowed(["estudiante", ...REVIEW], <Renewals />)}
    />
    <Route path="dashboard" element={allowed(REPORT, <Activity />)} />
  </Route>
);
