import { useAuth } from "../../app/Auth";
import ModuleLayout from "../../shared/ModuleLayout";
import { moduleLinks } from "../../../shared/navigation";
import "./styles.css";

export default function PeerEvaluationLayout() {
  const { user } = useAuth();
  return (
    <ModuleLayout
      number="05"
      title="Coevaluación"
      links={moduleLinks("coevaluacion", user.role)}
    />
  );
}
