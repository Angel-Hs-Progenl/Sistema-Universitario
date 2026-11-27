// Azor en vuelo: dibujo vectorial original a partir de las referencias del líder.
// La clase scene-azor conserva la entrada y el control de movimiento del portal.
export default function Goshawk() {
  const tail = "M254 190c-31 12-72 31-122 52-11 5-10 12 1 16l10 3c-4 6 3 10 13 9l9 2c2 6 12 7 22 3 34-13 67-30 95-52Z";
  const breast = "M326 164c-8 14-25 24-39 33-12 8-25 13-38 16 22 18 48 26 71 23 26-3 44-19 49-47l-10-24Z";
  const nearWing = "M296 171c-21-35-39-62-62-86-22-24-48-39-78-46l-24-5c-8-2-12 3-8 9l25 23-23-7c-9-2-13 2-7 10l27 25-20-6c-10-2-12 4-4 11l29 24-19-4c-10-1-11 5-2 11l32 22-15-2c-10 1-9 8 1 13l34 15c17 9 42 12 61 6 18-6 31-16 43-33Z";
  return (
    <g className="scene-azor" strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <clipPath id="goshawk-tail-clip">
          <path d={tail} />
        </clipPath>
        <clipPath id="goshawk-near-wing-clip">
          <path d={nearWing} />
        </clipPath>
        <pattern id="goshawk-barring" width="18" height="11" patternUnits="userSpaceOnUse">
          <path
            d="M-5 2q5 0 9 4l5-4m0 0q5 0 9 4l5-4"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.25"
            opacity=".8"
          />
        </pattern>
      </defs>

      {/* Ala lejana: rémiges abiertas y extremo redondeado. */}
      <path
        d="M310 180c6-30 22-65 46-88 16-16 38-30 61-39 8-3 12-2 10 3l-13 18 18-12c8-4 11-2 8 4l-17 21 17-10c8-4 11 0 7 6l-19 21 17-6c8-2 10 3 4 9l-21 17 15-2c8 0 9 5 2 10l-26 14c6 1 8 4 2 8-18 12-47 21-72 24Z"
        fill="var(--muted)"
        stroke="var(--ink)"
        strokeWidth="1.8"
      />
      <path
        d="M317 175c20-36 43-63 85-93m-72 88c20-29 42-51 85-80m-73 78c21-24 45-43 79-64m-65 60c20-17 39-27 61-38"
        fill="none"
        stroke="var(--surface)"
        strokeWidth="2"
        opacity=".75"
      />
      <path
        d="M371 112l12 8m6-20 14 9m2-23 14 7m-61 43 14 8m17-23 15 8m-44 24 12 6"
        stroke="var(--ink)"
        strokeWidth="2.5"
        opacity=".6"
      />

      {/* Cola larga, ancha y transversalmente barrada. */}
      <path d={tail} fill="var(--muted)" stroke="var(--ink)" strokeWidth="1.8" />
      <g clipPath="url(#goshawk-tail-clip)">
        <path
          d="M145 226l22 47m7-61 23 53m5-66 24 53m4-62 24 49m-112 9 119-52"
          stroke="var(--ink)"
          strokeWidth="7"
          opacity=".78"
        />
        <path
          d="M137 252c46-20 88-39 127-58m-110 67c41-15 80-32 113-51m-90 57c34-13 65-26 91-43"
          stroke="var(--surface)"
          strokeWidth="1.3"
          opacity=".75"
        />
      </g>

      {/* Espalda gris pizarra y cuerpo compacto. */}
      <path
        d="M220 178c19-21 46-33 75-32 17 1 31 8 46 7l25 15c-9 17-24 41-42 53-17 13-45 16-72 6l-37-20Z"
        fill="var(--ink)"
        stroke="var(--ink)"
        strokeWidth="1.8"
      />
      <path
        d="M227 179c19-16 40-23 62-21 18 2 31 9 44 8-18 12-37 23-55 37-16 10-31 12-45 8Z"
        fill="var(--muted)"
        opacity=".72"
      />
      <path d={breast} fill="var(--canvas)" stroke="var(--ink)" strokeWidth="1.5" />
      <path d={breast} fill="url(#goshawk-barring)" />
      <path
        d="M266 213c16 10 34 15 52 14m-38-22c17 9 36 11 53 7m-27-16c15 5 29 3 39-3"
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".8"
        opacity=".4"
      />

      {/* Ala cercana: borde ancho, primarias separadas y barras de pluma. */}
      <path d={nearWing} fill="var(--muted)" stroke="var(--ink)" strokeWidth="1.9" />
      <g clipPath="url(#goshawk-near-wing-clip)">
        <path
          d="M125 44c36 15 89 57 136 110m-134-89c38 21 81 57 127 101m-124-74c33 16 77 45 113 81m-108-54c31 11 65 32 95 61m-92-30c25 6 53 19 77 37"
          fill="none"
          stroke="var(--surface)"
          strokeWidth="3"
          opacity=".7"
        />
        <path
          d="M145 64l21 16m-14-4 25 19m-11-5 23 18m-8-4 24 19m-10-5 24 18m-9-4 24 17m-11-4 25 15m-104-48 20 14m-8-3 20 14m-9-3 22 14m-8-2 23 14m-9-1 24 13m-9-2 25 11m-14-2 22 9"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="3"
          opacity=".7"
        />
        <path
          d="M213 155c24 6 43 15 58 27m-54-16c18 4 32 11 44 20m-85-52c28 5 51 17 70 30"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="1.2"
          opacity=".65"
        />
      </g>
      <path
        d="M255 142c18 7 31 17 42 29-8 19-19 27-39 29 8-17 8-37-3-58Z"
        fill="var(--ink)"
      />
      <path
        d="M264 158l15 9m-16 2 14 8m-16 4 10 6"
        stroke="var(--surface)"
        strokeWidth="1.4"
        opacity=".7"
      />

      {/* Cara: capucha oscura, ceja blanca, iris ámbar y pico ganchudo. */}
      <path
        d="M322 160c3-17 5-29 15-38 9-9 23-12 36-7 11 3 18 10 20 21l10 8c1 12-6 23-18 28-15 6-29 3-42 11l-15-8Z"
        fill="var(--ink)"
        stroke="var(--ink)"
        strokeWidth="1.6"
      />
      <path
        d="M334 150c9-9 22-14 35-13 14 0 21 8 22 19-7 11-17 16-30 18-10 1-18 5-24 9l-9-8Z"
        fill="var(--canvas)"
      />
      <path
        d="M331 139c11-13 27-18 42-16 7 1 13 4 17 8-16-5-31-2-44 5l-15 13Z"
        fill="var(--muted)"
      />
      <path
        d="M334 136c12-12 28-16 42-11l11 7c-16-4-29-1-41 8l-13 5"
        fill="none"
        stroke="var(--surface)"
        strokeWidth="5"
      />
      <path
        d="M338 149c8-5 18-7 27-6m-19 11c7-3 14-4 22-2m-23 8c7-2 15-1 22 1m-23 6c7-1 13 0 19 2"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.1"
        opacity=".7"
      />
      <ellipse cx="372" cy="140" rx="5.5" ry="5.7" fill="var(--gold)" stroke="var(--ink)" strokeWidth="1.2" />
      <circle cx="373" cy="140" r="2.3" fill="var(--ink)" />
      <circle cx="374" cy="138.7" r=".8" fill="var(--surface)" />
      <path d="M389 143c4-2 9-1 13 3l-3 7-11-3Z" fill="var(--gold)" />
      <path
        d="M398 144c8 1 13 6 11 13l-7 10-7-1 4-7c-1-4-5-6-10-7Z"
        fill="var(--ink)"
        stroke="var(--ink)"
        strokeWidth="1"
      />
      <path d="m392 151 8 3m-43 21 11 2" stroke="var(--muted)" strokeWidth="1.1" />

      {/* Patas amarillas y uñas oscuras, independientes de la hoja animada. */}
      <path
        d="m291 225 8 17 10 8m18-30 9 15 12 10"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="4"
      />
      <g fill="none" stroke="var(--gold)" strokeWidth="2.8">
        <path d="M309 250c8-5 17-3 17 3m-17-3c5 5 8 11 5 15m-15-23c-7 4-9 10-4 14" />
        <path d="M348 245c9-3 17 1 16 7m-16-7c4 7 7 12 3 16m-15-26c-7 5-8 10-4 15" />
      </g>
      <path
        d="m326 253-5 2m-7 10-4-3m-15-6 3-5m66 1-5 1m-8 8-3-3m-16-8 3-4"
        stroke="var(--ink)"
        strokeWidth="1.8"
      />
    </g>
  );
}
