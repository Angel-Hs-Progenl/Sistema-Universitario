import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  UserRound,
  ChevronDown,
  Settings2,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { ROLES } from "../../shared/titulacion";

export default function AccountMenu({ user, onLogout, exiting }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null),
    trigger = useRef(null),
    id = useId();
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const outside = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    const keyboard = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keyboard);
    };
  }, [open]);
  return (
    <div
      className="account-menu"
      ref={root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="account-trigger"
        aria-label={`Cuenta de ${user.display_name || user.name}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <span className="account-avatar">
          <UserRound size={20} strokeWidth={1.6} />
        </span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="account-popover" id={id}>
          <div className="account-identity">
            <strong>{user.display_name || user.name}</strong>
            <span>{user.email}</span>
            <small>{ROLES[user.role]}</small>
          </div>
          <nav aria-label="Opciones de cuenta" onClick={() => setOpen(false)}>
            <Link to="/cuenta">
              <Settings2 size={16} />
              Editar perfil
            </Link>
            {user.role === "estudiante" && (
              <Link to="/titulacion/perfil">
                <GraduationCap size={16} />
                Datos para titulación
              </Link>
            )}
            <button type="button" disabled={exiting} onClick={onLogout}>
              <LogOut size={16} />
              {exiting ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
