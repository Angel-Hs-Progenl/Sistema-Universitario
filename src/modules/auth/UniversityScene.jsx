// Ilustración vectorial original del portal: azor, entrega y recepción.
// Las formas representan servicios compartidos, no un documento oficial.
import Goshawk from "./Goshawk";
export default function UniversityScene() {
  return (
    <svg
      className="university-scene"
      viewBox="0 0 720 540"
      fill="none"
      focusable="false"
    >
      <g
        className="scene-grid"
        stroke="var(--line)"
        strokeWidth=".65"
        opacity=".65"
      >
        {Array.from({ length: 11 }, (_, i) => (
          <path key={`a${i}`} d={`M${-240 + i * 90} 100l900 510`} />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <path key={`b${i}`} d={`M${-240 + i * 90} 560l900-510`} />
        ))}
      </g>

      {/* Una base común sostiene el espacio de recepción. */}
      <g className="scene-layer scene-layer-bottom" strokeLinejoin="round">
        <path
          d="m116 376 249-141 282 161-249 141Z"
          fill="var(--sage)"
          opacity=".45"
        />
        <path
          d="m150 327 226-128 247 141-226 129Z"
          fill="var(--canvas)"
          stroke="var(--ink)"
          strokeWidth="1.3"
        />
        <path
          d="m150 327 247 142v28L150 355Z"
          fill="var(--brand)"
          stroke="var(--brand)"
          strokeWidth="1.3"
        />
        <path
          d="m397 469 226-129v28L397 497Z"
          fill="var(--surface)"
          stroke="var(--ink)"
          strokeWidth="1.3"
        />
        <text
          className="scene-platform-name"
          transform="matrix(.87 .5 0 1 273.5 412)"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--surface)"
          fontSize="14"
          fontWeight="600"
          letterSpacing="1.2"
        >
          UT DE ORIENTAL
        </text>
        <path
          d="m177 312 195-110m49 244 175-100"
          stroke="var(--line)"
          strokeWidth="1.2"
        />
        <g stroke="var(--brand)" strokeWidth="1.4">
          <path d="m214 340 28-16 28 16-28 16Z" />
          <path d="m225 340 17 10 17-10" />
          <path d="m270 372 29-17m-17 25 29-17" opacity=".5" />
        </g>
      </g>

      {/* La bandeja recibe el documento; nunca representa un sello o dictamen. */}
      <g
        className="scene-layer scene-layer-middle"
        stroke="var(--green)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <path d="m344 329 108-61 113 65-108 62Z" fill="var(--sage)" />
        <path d="m344 329 113 66v27l-113-65Z" fill="var(--green)" />
        <path d="m457 395 108-62v27l-108 62Z" fill="var(--surface)" />
        <path
          d="m363 329 89-50 94 54-89 51Z"
          fill="var(--canvas)"
          opacity=".8"
        />
        <path d="m364 338 93 54 88-50" />
      </g>

      <path
        className="scene-trace delivery-route"
        pathLength="1"
        d="M329 242c0 42 24 51 61 65"
        stroke="var(--gold)"
        strokeWidth="1.5"
      />

      <Goshawk />

      {/* La hoja viaja desde las garras hasta la bandeja en una sola entrada. */}
      <g className="scene-delivery" strokeLinejoin="round">
        <path
          d="m384 316 66-38 78 44-66 39Z"
          fill="var(--surface)"
          stroke="var(--ink)"
          strokeWidth="1.2"
        />
        <path
          d="m384 307 66-38 78 44-66 39Z"
          fill="var(--surface)"
          stroke="var(--ink)"
          strokeWidth="1.2"
        />
        <path
          d="m384 298 66-38 78 44-66 39Z"
          fill="var(--surface)"
          stroke="var(--ink)"
          strokeWidth="1.3"
        />
        <path
          d="m447 272 18-10 20 12-18 10Z"
          stroke="var(--gold)"
          strokeWidth="1.5"
        />
        <path
          d="m414 295 50 29m-62-22 50 29m-38-16 24 14"
          stroke="var(--line)"
          strokeWidth="1.8"
        />
      </g>

      <g className="scene-spark" stroke="var(--gold)" strokeWidth="1.2">
        <path d="M575 217h14m-7-7v14" />
        <circle cx="95" cy="281" r="4" />
      </g>
    </svg>
  );
}
