import { useId } from "react";

// Ilustración vectorial propia. No representa el campus ni un documento oficial.
export default function WelcomeArt() {
  const id = useId();
  return (
    <div className="welcome-art" aria-hidden="true">
      <svg viewBox="0 0 680 570" fill="none" focusable="false">
        <defs>
          <linearGradient
            id={`${id}-light`}
            x1="200"
            y1="160"
            x2="470"
            y2="470"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--canvas)" />
            <stop offset="1" stopColor="var(--sage)" />
          </linearGradient>
          <linearGradient
            id={`${id}-wall`}
            x1="145"
            y1="90"
            x2="460"
            y2="500"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--brand)" />
            <stop offset="1" stopColor="var(--ink)" />
          </linearGradient>
        </defs>
        <g className="art-guide" stroke="var(--line)" strokeWidth="1">
          <path d="M40 462 357 315 647 454 330 555Z" />
          <path d="M40 490 357 343 647 482M110 430 401 569M540 402 225 549" />
          <path strokeDasharray="3 6" d="M301 40V525M90 245H570" />
        </g>
        <circle
          className="art-sun"
          cx="510"
          cy="110"
          r="52"
          fill="var(--gold)"
        />
        <path d="M94 475 355 351 612 472 351 555Z" fill="var(--sage)" />
        <path
          d="M205 463V210C205 124 275 54 361 54S517 124 517 210V463L461 490V214C461 159 416 114 361 114S261 159 261 214V490Z"
          fill="var(--green)"
        />
        <path
          d="M145 490 205 463V210C205 124 275 54 361 54L301 83C215 83 145 153 145 239Z"
          fill="var(--brand)"
          opacity=".75"
        />
        <path
          d="M199 490 261 463V214C261 159 306 114 361 114L301 143C245 143 199 189 199 245Z"
          fill={`url(#${id}-light)`}
        />
        <path
          d="M403 490 461 463V214C461 159 416 114 361 114L301 143C357 143 403 189 403 245Z"
          fill="var(--sage)"
        />
        <path
          d="M145 490V245C145 159 215 89 301 89S457 159 457 245V490H403V245C403 189 357 143 301 143S199 189 199 245V490Z"
          fill={`url(#${id}-wall)`}
        />
        <path d="M199 490 261 463H461L403 490Z" fill="var(--surface)" />
        <path
          d="M261 463V214C261 159 306 114 361 114S461 159 461 214V463"
          stroke="var(--surface)"
          opacity=".45"
        />
        <g className="art-door">
          <path d="M268 454V257L363 211V408Z" fill="var(--brand)" />
          <path
            d="m268 257 95-46v197l-95 46V257Z"
            stroke="var(--gold)"
            strokeWidth="2"
          />
          <path
            d="m285 267 61-29v159l-61 29V267Z"
            stroke="var(--surface)"
            opacity=".2"
          />
          <path d="m338 337 8-4v18l-8 4Z" fill="var(--gold)" />
        </g>
        <path
          className="art-path"
          d="m62 516 187-89 18-8"
          stroke="var(--gold)"
          strokeWidth="3"
        />
        <g stroke="var(--green)" strokeWidth="1.5">
          <path d="M533 292h18m-9-9v18M113 164h14m-7-7v14" />
        </g>
        <path d="M488 493h82" stroke="var(--line)" />
        <path d="M488 500h41" stroke="var(--line)" />
      </svg>
    </div>
  );
}
