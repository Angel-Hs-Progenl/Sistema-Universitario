import { useState } from "react";
import { RotateCcw } from "lucide-react";
import useReducedMotion from "../../shared/useReducedMotion";
import UniversityScene from "./UniversityScene";

// Bienvenida común para todos los servicios; respeta la preferencia CR-006.
export default function WelcomeArt() {
  const [take, setTake] = useState(0);
  const reducedMotion = useReducedMotion();
  return (
    <div className="welcome-scene">
      <div
        className="welcome-art welcome-art-university"
        key={take}
        aria-hidden="true"
      >
        <UniversityScene />
      </div>
      <div className="scene-caption">
        <span>Trámites · Evaluaciones · Apoyos</span>
        {reducedMotion ? (
          <span title="Puedes activarlas desde el pie de página.">
            Animaciones desactivadas
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setTake((t) => t + 1)}
            aria-label="Repetir animación de bienvenida"
          >
            <RotateCcw size={14} />
            <span>Repetir</span>
          </button>
        )}
      </div>
    </div>
  );
}
