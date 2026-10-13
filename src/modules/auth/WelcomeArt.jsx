import { useState } from "react";
import { RotateCcw } from "lucide-react";
import useReducedMotion from "../../shared/useReducedMotion";

// Composición vectorial propia: etapas del expediente, sin sellos oficiales.
export default function WelcomeArt() {
  const [take, setTake] = useState(0);
  const reducedMotion = useReducedMotion();
  return (
    <div className="welcome-scene">
      <div className="welcome-art" key={take} aria-hidden="true">
        <svg viewBox="0 0 680 530" fill="none" focusable="false">
          <g className="scene-grid" stroke="var(--line)" strokeWidth=".65">
            {Array.from({ length: 12 }, (_, i) => (
              <path key={`a${i}`} d={`M${-280 + i * 85} 0l920 530`} />
            ))}
            {Array.from({ length: 12 }, (_, i) => (
              <path key={`b${i}`} d={`M${-280 + i * 85} 530l920-530`} />
            ))}
          </g>
          <path
            d="m105 404 228-124 255 146-227 124Z"
            fill="var(--sage)"
            opacity=".55"
          />
          <g className="scene-layer scene-layer-bottom">
            <path
              d="m130 307 215-119 216 119-215 119Z"
              fill="var(--sage)"
              stroke="var(--green)"
            />
            <path
              d="m130 307 215 119v32L130 339Z"
              fill="var(--green)"
              stroke="var(--green)"
            />
            <path
              d="m345 426 216-119v32L345 458Z"
              fill="var(--surface)"
              stroke="var(--green)"
            />
            <text
              transform="matrix(.88 .49 0 1 158 332)"
              fill="var(--surface)"
              fontSize="17"
            >
              03 / SEGUIMIENTO
            </text>
            <path
              d="m205 305 141-77 140 78-141 77Z"
              stroke="var(--green)"
              opacity=".4"
            />
          </g>
          <g className="scene-layer scene-layer-middle">
            <path
              d="m130 207 215-119 216 119-215 119Z"
              fill="var(--surface)"
              stroke="var(--brand)"
            />
            <path
              d="m130 207 215 119v32L130 239Z"
              fill="var(--brand)"
              stroke="var(--brand)"
            />
            <path
              d="m345 326 216-119v32L345 358Z"
              fill="var(--brand-soft)"
              stroke="var(--brand)"
            />
            <text
              transform="matrix(.88 .49 0 1 158 232)"
              fill="var(--surface)"
              fontSize="17"
            >
              02 / DOCUMENTOS
            </text>
            <g stroke="var(--brand)" strokeWidth="1.5" opacity=".5">
              <path d="m242 199 87-48 124 69-87 48Z" />
              <path d="m270 199 51-28m-32 40 51-28m-32 40 51-28" />
            </g>
          </g>
          <g className="scene-layer scene-layer-top">
            <path
              d="m130 107 215-119 216 119-215 119Z"
              fill="var(--canvas)"
              stroke="var(--ink)"
            />
            <path
              d="m130 107 215 119v32L130 139Z"
              fill="var(--canvas)"
              stroke="var(--ink)"
            />
            <path
              d="m345 226 216-119v32L345 258Z"
              fill="var(--surface)"
              stroke="var(--ink)"
            />
            <text
              transform="matrix(.88 .49 0 1 158 132)"
              fill="var(--ink)"
              fontSize="17"
            >
              01 / TUS DATOS
            </text>
            <path
              d="m282 78 57-32 71 40-57 32Z"
              stroke="var(--gold)"
              strokeWidth="2"
            />
            <path
              d="m277 109 80 45m-98-34 80 45"
              stroke="var(--ink)"
              opacity=".35"
            />
          </g>
          <g className="scene-route" stroke="var(--brand)" strokeWidth="1.5">
            <path
              className="scene-trace"
              pathLength="1"
              d="M30 382 105 424 206 480 282 438"
            />
            <circle cx="30" cy="382" r="5" fill="var(--canvas)" />
            <circle cx="105" cy="424" r="5" fill="var(--canvas)" />
            <circle cx="206" cy="480" r="5" fill="var(--brand)" />
          </g>
          <g className="scene-spark" stroke="var(--gold)" strokeWidth="1.5">
            <path d="M585 163h18m-9-9v18M82 175h12m-6-6v12" />
          </g>
        </svg>
      </div>
      <div className="scene-caption">
        <span>Datos. Documentos. Seguimiento.</span>
        {reducedMotion ? (
          <span title="Tu dispositivo solicita reducir el movimiento.">
            Movimiento reducido
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
