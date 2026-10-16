// Dibujo original: alas anchas, cola larga barrada y ceja clara del azor.
// Referencias anatómicas y alcance gráfico: docs/DISENO.md, CR-009.
export default function Goshawk() {
  return (
    <g className="scene-azor" strokeLinejoin="round" strokeLinecap="round">
      {/* Ala lejana con plumas redondeadas y borde posterior amplio. */}
      <path
        d="M307 159c14-34 45-77 90-101 12-7 24-11 28-7 4 5-7 16-20 27 16-11 31-16 35-11 4 6-9 20-24 31 17-10 29-11 31-5 2 7-12 19-27 28 14-5 23-4 22 2-2 8-19 17-35 22 10 0 16 3 11 9-14 13-44 24-65 24Z"
        fill="var(--brand-soft)"
        stroke="var(--ink)"
        strokeWidth="1.6"
      />
      <g stroke="var(--brand)" strokeWidth="1.1" opacity=".6">
        <path d="M405 78c-28 22-49 49-65 78m76-58c-26 17-45 36-61 61m65-38c-20 9-36 23-50 41m37-17-23 20" />
      </g>

      {/* Cola larga, ligeramente abierta, con bandas transversales. */}
      <path
        d="M246 191c-32 14-68 33-113 52-7 3-6 9 1 11l9 3c-7 4-3 9 5 10l12 2c-1 5 10 7 21 4 38-12 68-30 91-55Z"
        fill="var(--brand)"
        stroke="var(--ink)"
        strokeWidth="1.6"
      />
      <path
        d="M170 235q9 12 25 22m3-35q12 12 24 21m4-36q12 12 21 17"
        stroke="var(--canvas)"
        strokeWidth="5"
      />
      <path
        d="m145 253 79-38m-65 49 72-43"
        stroke="var(--ink)"
        strokeWidth=".9"
        opacity=".5"
      />

      {/* Tronco robusto y pecho claro; el barrado no es un adorno geométrico. */}
      <path
        d="M221 182c23-24 57-37 92-28 14 2 24 1 32-5l25 20c-13 18-17 39-34 52-22 15-54 14-84 3l-33-13Z"
        fill="var(--brand)"
        stroke="var(--ink)"
        strokeWidth="1.7"
      />
      <path
        d="M335 174c2 16-11 27-31 30-20 1-38 5-54 16 29 18 64 22 85 5 16-12 25-34 28-49Z"
        fill="var(--canvas)"
        stroke="var(--ink)"
        strokeWidth="1.3"
      />
      <g stroke="var(--ink)" strokeWidth="1.05" opacity=".65">
        <path d="M328 190q10 6 21 3m-30 7q11 6 23 3m-35 5q12 5 24 2m-44 6q12 6 25 3m-9 6q10 3 19-1m-43-3q8 4 15 3" />
      </g>

      {/* Ala cercana: contorno orgánico, rémiges separadas y plumas de cobertura. */}
      <path
        d="M293 164c-17-22-33-48-53-72-23-28-59-50-97-55-8-1-14 3-11 9l29 27c-12-7-24-10-31-8-6 2-3 9 4 14l31 24c-15-7-26-8-31-4-5 4 0 10 9 15l35 22c-18-7-27-8-32-4-5 6 2 11 13 16l37 21c-15-6-26-5-26 2 1 10 23 22 45 27 35 11 63-3 78-34Z"
        fill="var(--surface)"
        stroke="var(--ink)"
        strokeWidth="1.8"
      />
      <g stroke="var(--ink)" strokeWidth="1.15" opacity=".8">
        <path d="M151 49c42 25 79 59 116 108m-106-84c37 25 67 53 97 88m-93-58c33 17 61 39 85 63m-72-30c25 11 47 23 65 36m-47-3c16 6 30 11 42 12" />
      </g>
      <g stroke="var(--brand)" strokeWidth="1.8" opacity=".55">
        <path d="m169 70 13-7m-3 23 17-10m-5 25 19-11m-2 27 20-12m-5 28 19-13m-2 30 16-13m-49 4 16-10m-1 25 14-9m-46-14 13-7" />
      </g>
      <path
        d="M260 148c10 1 22 7 30 17-6 17-18 26-32 30 6-14 7-29 2-47Z"
        fill="var(--brand)"
      />
      <path
        d="m267 164 12 4m-14 6 10 4m-13 5 8 4"
        stroke="var(--canvas)"
        strokeWidth="1.2"
      />

      {/* Cabeza compacta, ceja clara y pico corto con gancho definido. */}
      <path
        d="M325 164c4-18 0-33 13-43 9-9 25-7 36 3 5 6 6 12 5 18l10 5c-1 11-7 20-16 24-15 7-32 5-42 12Z"
        fill="var(--ink)"
        stroke="var(--ink)"
        strokeWidth="1.7"
      />
      <path
        d="M337 132c11-5 24-7 35-5 4 1 4 3 0 5l-27 7Z"
        fill="var(--canvas)"
      />
      <circle cx="366" cy="140" r="4.4" fill="var(--gold)" />
      <circle cx="367" cy="140" r="2.2" fill="var(--ink)" />
      <circle cx="367.6" cy="138.8" r=".7" fill="var(--surface)" />
      <path d="M379 142c6-2 12 1 15 6l-5 9-8-5Z" fill="var(--gold)" />
      <path
        d="M391 146c9 1 15 7 13 15l-6 5v-8c-2-4-6-5-11-5Z"
        fill="var(--ink)"
      />
      <path
        d="M341 156c8 6 14 7 22 7-7 10-15 16-25 20l-3-12Z"
        fill="var(--canvas)"
      />
      <path d="m344 164 8 3m-11 4 7 3" stroke="var(--ink)" strokeWidth="1.1" />

      {/* Tarsos y dedos articulados; puntas oscuras de las garras. */}
      <path
        d="m291 220 9 18q-1 6 8 10m21-35 8 16q0 9 11 12"
        stroke="var(--gold)"
        strokeWidth="4"
      />
      <g stroke="var(--gold)" strokeWidth="2.5">
        <path d="M308 248c10-4 17-1 14 5m-14-5c5 6 10 11 6 15m-14-25c-6 5-8 9-3 13" />
        <path d="M348 241c10-3 17 1 14 7m-14-7c4 5 9 10 5 14m-16-26c-6 5-7 11-3 14" />
      </g>
      <g stroke="var(--ink)" strokeWidth="1.6">
        <path d="m322 253-4 2m-4 8-3-3m-14-9 2-4m63 1-4 1m-5 6-2-3m-17-9 2-3" />
      </g>
    </g>
  );
}
