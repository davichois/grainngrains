"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface HeaderVisibilityValue {
  /** Si está activo, el header se oculta arriba del todo y aparece al hacer scroll */
  hideAtTop: boolean;
  setHideAtTop: (value: boolean) => void;
}

const HeaderVisibilityContext = createContext<HeaderVisibilityValue | null>(
  null,
);

export function HeaderVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hideAtTop, setHideAtTop] = useState(false);
  return (
    <HeaderVisibilityContext.Provider value={{ hideAtTop, setHideAtTop }}>
      {children}
    </HeaderVisibilityContext.Provider>
  );
}

export function useHeaderVisibility() {
  return useContext(HeaderVisibilityContext);
}

/**
 * Renderiza este componente dentro de cualquier página/sección para que el
 * header empiece oculto y reaparezca al hacer scroll hacia abajo.
 * Al desmontarse (cambiar de página) restaura el comportamiento normal.
 */
export function HideHeaderAtTop() {
  const ctx = useHeaderVisibility();
  const setHideAtTop = ctx?.setHideAtTop;

  useEffect(() => {
    if (!setHideAtTop) return;
    setHideAtTop(true);
    return () => setHideAtTop(false);
  }, [setHideAtTop]);

  return null;
}
