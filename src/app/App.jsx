import { lazy } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { AuthProvider, Protected } from "./Auth";
import RoleRoute from "./RoleRoute";
import Shell from "./Shell";
import { NavigationProvider } from "./Navigation";
import Home from "../modules/home/Home";
import Login, { Recover } from "../modules/auth/Login";
import { Help, Privacy, Notifications } from "../modules/home/Information";
import { scholarshipRoutes } from "../modules/becas/routes";
import { evaluationRoutes } from "../modules/evaluacion-docente/routes";
import { MODULES } from "../../shared/navigation";
const TitleLayout = lazy(() => import("../modules/titulacion/Layout"));
const Workspace = lazy(() => import("../modules/titulacion/Workspace"));
const Profile = lazy(() => import("../modules/titulacion/Profile"));
const Account = lazy(() => import("../modules/auth/Account"));
export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <Routes>
          <Route element={<Shell />}>
            <Route
              index
              element={
                <Protected>
                  <Home />
                </Protected>
              }
            />
            <Route path="acceso" element={<Login />} />
            <Route path="recuperar" element={<Recover />} />
            <Route
              path="cuenta"
              element={
                <Protected>
                  <Account />
                </Protected>
              }
            />
            <Route path="ayuda" element={<Help />} />
            <Route path="privacidad" element={<Privacy />} />
            <Route
              path="notificaciones"
              element={
                <Protected>
                  <Notifications />
                </Protected>
              }
            />
            <Route
              path="titulacion"
              element={
                <RoleRoute roles={MODULES[0].roles}>
                  <TitleLayout />
                </RoleRoute>
              }
            >
              <Route index element={<Workspace />} />
              <Route path="perfil" element={<Profile />} />
              <Route path="documentos" element={<Workspace />} />
              <Route path="seguimiento" element={<Workspace />} />
              <Route path="expediente/:id" element={<Workspace />} />
            </Route>
            {scholarshipRoutes}
            {evaluationRoutes}
            <Route
              path="*"
              element={
                <div className="container narrow-page">
                  <h1>Página no encontrada</h1>
                  <p>Revisa la dirección o vuelve al inicio del portal.</p>
                  <Link className="button button-primary" to="/">
                    Volver al inicio
                  </Link>
                </div>
              }
            />
          </Route>
        </Routes>
      </NavigationProvider>
    </AuthProvider>
  );
}
