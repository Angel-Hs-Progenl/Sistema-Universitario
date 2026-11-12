
import { useAuth } from "../../app/Auth";
import ModuleLayout from "../../shared/ModuleLayout";
import { moduleLinks } from "../../../shared/navigation";
import "./styles.css";

export default function SelfEvaluationLayout() {
  const { user } = useAuth();

  return (
    <ModuleLayout
      number="04"
      title="Autoevaluación"
      links={moduleLinks("autoevaluacion", user.role)}
    />
  );
}
