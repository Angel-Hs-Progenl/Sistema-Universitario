import { createContext, useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { breadcrumbsFor } from "../../shared/navigation";
import { useAuth } from "./Auth";

const NavigationContext = createContext(null);
export function NavigationProvider({ children }) {
  const [entity, setEntity] = useState(null);
  return (
    <NavigationContext.Provider value={{ entity, setEntity }}>
      {children}
    </NavigationContext.Provider>
  );
}
export function useBreadcrumbEntity(label) {
  const { pathname } = useLocation();
  const { setEntity } = useContext(NavigationContext);
  useEffect(() => {
    if (label) setEntity({ path: pathname, label });
    return () =>
      setEntity((current) => (current?.path === pathname ? null : current));
  }, [pathname, label, setEntity]);
}
export function Breadcrumbs() {
  const { pathname } = useLocation(),
    { user } = useAuth(),
    { entity } = useContext(NavigationContext);
  const items = breadcrumbsFor(
    pathname,
    !!user,
    entity?.path === pathname ? entity.label : undefined,
  );
  return (
    <nav className="breadcrumbs" aria-label="Migas de pan">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {index > 0 && <ChevronRight size={13} aria-hidden="true" />}
            {index === items.length - 1 ? (
              <span aria-current="page">{item.label}</span>
            ) : (
              <Link to={item.path}>{item.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
