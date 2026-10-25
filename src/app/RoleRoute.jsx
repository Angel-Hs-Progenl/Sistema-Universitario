import { Link } from "react-router-dom";
import { Protected, useAuth } from "./Auth";
import { Empty } from "../shared/ui";

export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  return (
    <Protected>
      {user && roles.includes(user.role) ? (
        children
      ) : (
        <div className="container">
          <Empty
            title="Este servicio no está habilitado para tu rol"
            action={
              <Link className="button button-primary" to="/">
                Volver al inicio
              </Link>
            }
          >
            Si necesitas una función adicional, solicita la revisión de tus
            permisos al responsable del portal.
          </Empty>
        </div>
      )}
    </Protected>
  );
}
