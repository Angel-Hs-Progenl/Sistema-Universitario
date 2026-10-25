import { useAuth } from "../../app/Auth";
import ModuleLayout from "../../shared/ModuleLayout";
import { moduleLinks } from "../../../shared/navigation";
export default function BecasLayout() {
  const { user } = useAuth();
  return (
    <ModuleLayout
      number="02"
      title="Gestión de becas"
      links={moduleLinks("becas", user.role)}
    />
  );
}
