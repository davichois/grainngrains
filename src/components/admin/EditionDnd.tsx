"use client";

import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { GripVertical, Loader2 } from "lucide-react";
import { moveProduct } from "@/src/app/admin/(panel)/actions/products";

/* ───────────────────────────────────────────────────────────────
   Arrastrar un café a otra edición (lista de Productos). Con eventos de
   puntero, así funciona igual con mouse y con el dedo: se toma el café
   por su asa, se suelta sobre la tarjeta de otra edición y se guarda.
─────────────────────────────────────────────────────────────── */

type Drag = { id: string; name: string; from: string; x: number; y: number };
type Ctx = {
  drag: Drag | null;
  over: string | null;
  moving: string | null;
  begin: (d: Drag) => void;
};

const DndContext = createContext<Ctx | null>(null);
const useDnd = () => useContext(DndContext)!;

/** Envuelve la lista de ediciones */
export function EditionDnd({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [, start] = useTransition();
  const overRef = useRef<string | null>(null);
  const scroll = useRef(0);

  useEffect(() => {
    if (!drag) return;
    let raf = 0;
    /* Desplaza la página si el café se lleva al borde de la pantalla */
    const tick = () => {
      if (scroll.current) window.scrollBy(0, scroll.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
      const zone = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>("[data-drop-edition]");
      const target = zone?.dataset.dropEdition ?? null;
      overRef.current = target;
      setOver(target);
      const edge = 70;
      scroll.current = e.clientY < edge ? -12 : e.clientY > window.innerHeight - edge ? 12 : 0;
    };
    const onUp = () => {
      const target = overRef.current;
      const d = drag;
      setDrag(null);
      setOver(null);
      overRef.current = null;
      scroll.current = 0;
      if (!target || target === d.from) return;
      setMoving(d.id);
      setError("");
      start(async () => {
        const r = await moveProduct(d.id, target);
        if (r?.error) setError(`${d.name}: ${r.error}`);
        setMoving(null);
      });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      overRef.current = null;
      onUp();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    document.body.style.userSelect = "none";
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
      document.body.style.userSelect = "";
    };
    // Solo al empezar o terminar de arrastrar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.id]);

  return (
    <DndContext.Provider value={{ drag: disabled ? null : drag, over, moving, begin: setDrag }}>
      {error && (
        <p role="alert" className="mb-4 border border-adm-red-line px-4 py-3 text-sm font-medium text-adm-red">
          {error}
        </p>
      )}
      {children}
      {drag && (
        <div
          className="pointer-events-none fixed z-50 flex -translate-x-4 -translate-y-1/2 items-center gap-2 border border-[#0FC0FC] bg-adm-surface px-3.5 py-2.5 text-sm font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          style={{ left: drag.x, top: drag.y }}
        >
          <GripVertical size={14} className="text-adm-cyan-ink" />
          {drag.name}
          <span className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-muted">
            {over && over !== drag.from ? "Soltar aquí" : "Llévalo a otra edición"}
          </span>
        </div>
      )}
    </DndContext.Provider>
  );
}

/** Tarjeta de una edición: recibe cafés */
export function EditionDrop({ id, children }: { id: string; children: React.ReactNode }) {
  const { drag, over } = useDnd();
  const target = drag && drag.from !== id;
  return (
    <div
      data-drop-edition={id}
      className={`transition-[outline-color,transform] duration-150 ${
        target ? `outline-2 outline-offset-2 ${over === id ? "scale-[1.005] outline-[#0FC0FC]" : "outline-dashed outline-adm-line3"}` : "outline-transparent"
      }`}
    >
      {children}
    </div>
  );
}

/** Fila de un café: el asa para arrastrarlo y su estado mientras se mueve */
export function DragCoffee({
  id,
  name,
  edition,
  disabled,
  className = "",
  children,
}: {
  id: string;
  name: string;
  edition: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { drag, moving, begin } = useDnd();
  const busy = moving === id;
  return (
    <li className={`${className} transition-opacity ${drag?.id === id || busy ? "opacity-40" : ""}`}>
      {!disabled && (
        <button
          type="button"
          aria-label={`Arrastrar ${name} a otra edición`}
          title="Arrastra a otra edición"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            begin({ id, name, from: edition, x: e.clientX, y: e.clientY });
          }}
          className="-ml-2 flex h-10 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-adm-faint transition-colors hover:text-adm-ink active:cursor-grabbing"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <GripVertical size={16} />}
        </button>
      )}
      {children}
    </li>
  );
}
