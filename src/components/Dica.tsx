import { useCallback, useRef, useState, type ReactNode } from "react";

/** Tooltip customizado que segue o ponteiro dentro de um contêiner. */
export function useDica() {
  const ref = useRef<HTMLDivElement>(null);
  const [d, setD] = useState<{ x: number; y: number; c: ReactNode } | null>(null);
  const mostrar = useCallback((e: React.MouseEvent | React.FocusEvent, c: ReactNode) => {
    const box = ref.current?.getBoundingClientRect(); if (!box) return;
    const t = (e.target as Element).getBoundingClientRect();
    const x = "clientX" in e && e.clientX ? e.clientX : t.left + t.width / 2;
    const y = "clientY" in e && e.clientY ? e.clientY : t.top;
    setD({ x: x - box.left, y: y - box.top, c });
  }, []);
  const esconder = useCallback(() => setD(null), []);
  const dica = d && (
    <div role="tooltip" className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap border border-foreground bg-foreground px-2 py-1 text-xs text-background shadow-md"
      style={{ left: d.x, top: d.y - 10 }}>{d.c}</div>
  );
  return { ref, mostrar, esconder, dica };
}
