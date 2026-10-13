import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useReducedMotion from "./useReducedMotion";

// Se ejecuta una vez por carga del documento; no reinicia al cambiar de módulo.
let introduced = false;
export default function Brand() {
  const [intro, setIntro] = useState(!introduced);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!intro) return;
    const finish = () => {
      introduced = true;
      setIntro(false);
    };
    // Espera la carga del PNG antes de iniciar el giro; el header mantiene su espacio.
    const timer = window.setTimeout(
      finish,
      ready ? (reduced ? 900 : 1900) : 3500,
    );
    return () => window.clearTimeout(timer);
  }, [intro, ready, reduced]);
  return (
    <Link className="brand" to="/" aria-label="UT de Oriental, inicio">
      <span
        className={`brand-flip ${intro ? "brand-intro" : ""} ${ready ? "brand-ready" : ""}`}
        aria-hidden="true"
      >
        <span className="brand-face brand-original">
          <img
            src="/brand/ut-oficial.png"
            alt=""
            width="44"
            height="44"
            onLoad={() => setReady(true)}
            onError={() => setIntro(false)}
          />
        </span>
        <span className="brand-face brand-portal">
          <img src="/brand/azor.svg" alt="" width="40" height="40" />
        </span>
      </span>
      <span>
        <strong>UT de Oriental</strong>
        <small>Portal universitario</small>
      </span>
    </Link>
  );
}
