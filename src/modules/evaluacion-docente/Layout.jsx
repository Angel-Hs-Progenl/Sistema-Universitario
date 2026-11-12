import { useAuth } from "../../app/Auth";
import ModuleLayout from "../../shared/ModuleLayout";
import { moduleLinks } from "../../../shared/navigation";
export default function EvaluationLayout() {
  const { user } = useAuth();
  return (
    <ModuleLayout
      number="03"
      title="Evaluación docente"
      links={moduleLinks("evaluacion-docente", user.role)}
    />
  );
}
