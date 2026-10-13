import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

const KEY = "uto:animations";
const MotionContext = createContext(null);
function readPreference() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function MotionProvider({ children }) {
  const [enabled, setEnabled] = useState(readPreference);
  useLayoutEffect(() => {
    document.documentElement.dataset.motion = enabled ? "on" : "off";
  }, [enabled]);
  useEffect(() => {
    const sync = (event) => {
      if (event.key === KEY || event.key === null) setEnabled(readPreference());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function toggle() {
    const next = !enabled;
    setEnabled(next);
    // Solo apariencia: no contiene sesiones, credenciales o datos de expedientes.
    try {
      localStorage.setItem(KEY, next ? "on" : "off");
    } catch {
      /* Preferencia en memoria si no hay almacenamiento. */
    }
  }
  return (
    <MotionContext.Provider value={{ enabled, toggle }}>
      {children}
    </MotionContext.Provider>
  );
}

export const useMotionPreference = () => useContext(MotionContext);
