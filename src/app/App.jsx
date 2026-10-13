import { lazy, Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { AuthProvider, Protected } from "./Auth";
import Shell from "./Shell";
import { NavigationProvider } from "./Navigation";
import Home from "../modules/home/Home";
import Login, { Recover } from "../modules/auth/Login";
import { Help, Privacy, Notifications } from "../modules/home/Information";
const TitleLayout = lazy(() => import("../modules/titulacion/Layout"));
const Workspace = lazy(() => import("../modules/titulacion/Workspace"));
const Profile = lazy(() => import("../modules/titulacion/Profile"));
export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <Suspense
          fallback={
            <div className="page-loading" role="status">
              Cargando servicio…
            </div>
          }
        >
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
                  <Protected>
                    <TitleLayout />
                  </Protected>
                }
              >
                <Route index element={<Workspace />} />
                <Route path="perfil" element={<Profile />} />
                <Route path="documentos" element={<Workspace />} />
                <Route path="seguimiento" element={<Workspace />} />
                <Route path="expediente/:id" element={<Workspace />} />
              </Route>
              <Route
                path="*"
                element={
                  <div className="container narrow-page">
                    <span className="eyebrow">404</span>
                    <h1>Esta página no está aquí.</h1>
                    <p>
                      Vuelve al inicio para encontrar el servicio que necesitas.
                    </p>
                    <Link className="button button-primary" to="/">
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
