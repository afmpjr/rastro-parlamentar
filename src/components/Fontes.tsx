import { useEffect, useId, useRef, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import type { Fonte } from "@/lib/fontes.functions";

export function Fontes({ fontes }: { fontes: Fonte[] }) {
  return (
    <aside className="mt-12 border-t-2 border-foreground pt-4">
      <p className="label-caps mb-2">Evidências · dado oficial</p>
      <ul className="space-y-1 text-sm">
        {fontes.map((f) => (
          <li key={f.url} className="flex flex-wrap gap-x-2">
            <span className="font-medium">{f.orgao}</span>
            <a className="link-evidence break-all" href={f.url} target="_blank" rel="noreferrer">{f.url}</a>
            <span className="text-muted-foreground">coletado {new Date(f.coletadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

const EXPLICA_PADRAO = "Soma, contagem ou percentual feito por nós a partir dos dados oficiais. A fonte publica os itens um a um; o número mostrado aqui é calculado pelo site.";

/** Selo de procedência. "Dado oficial" abre a fonte; "Cálculo da plataforma" explica como o número foi obtido. */
export function Selo({ tipo, url, explica }: { tipo: "oficial" | "calculo"; url?: string | undefined; explica?: string }) {
  if (tipo === "oficial")
    return url
      ? <a href={url} target="_blank" rel="noreferrer" className="selo-oficial inline-flex items-center gap-1 hover:underline">Dado oficial<ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only"> (abre em nova aba)</span></a>
      : <span className="selo-oficial">Dado oficial</span>;
  return <SeloCalculo explica={explica ?? EXPLICA_PADRAO} />;
}

/** Selo clicável: abre uma etiqueta explicando o cálculo (hover, teclado ou clique). */
function SeloCalculo({ explica }: { explica: string }) {
  const id = useId();
  const gatilho = useRef<HTMLButtonElement>(null);
  const [aberta, setAberta] = useState(false);
  const [fixa, setFixa] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number; cima: boolean } | null>(null);

  const mostrar = () => {
    const r = gatilho.current?.getBoundingClientRect();
    if (!r) return;
    const LARG = 288;
    const cima = r.bottom + 130 > window.innerHeight;
    setPos({
      x: Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - LARG - 8)),
      y: cima ? r.top - 6 : r.bottom + 6,
      cima,
    });
    setAberta(true);
  };
  const esconder = () => { if (!fixa) setAberta(false); };
  const fechar = () => { setFixa(false); setAberta(false); };
  const alternar = () => { if (fixa) fechar(); else { mostrar(); setFixa(true); } };

  useEffect(() => {
    if (!fixa) return;
    const fora = (e: PointerEvent) => { if (!gatilho.current?.contains(e.target as Node)) fechar(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") fechar(); };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", fora); document.removeEventListener("keydown", esc); };
  }, [fixa]);

  useEffect(() => {
    if (!aberta) return;
    const sair = () => { setFixa(false); setAberta(false); };
    window.addEventListener("scroll", sair, true);
    window.addEventListener("resize", sair);
    return () => { window.removeEventListener("scroll", sair, true); window.removeEventListener("resize", sair); };
  }, [aberta]);

  return (
    <span className="relative inline-flex">
      <button ref={gatilho} type="button" className="selo-calculo inline-flex items-center gap-1 hover:underline"
        aria-describedby={aberta ? id : undefined} aria-expanded={aberta}
        onMouseEnter={mostrar} onMouseLeave={esconder} onFocus={mostrar} onBlur={esconder} onClick={alternar}>
        Cálculo da plataforma<Info className="h-3 w-3" aria-hidden />
      </button>
      {aberta && pos && (
        <span role="tooltip" id={id}
          className="pointer-events-none fixed z-50 w-72 max-w-[calc(100vw-1rem)] border border-foreground bg-foreground px-3 py-2 text-left text-xs leading-snug font-normal normal-case tracking-normal text-background shadow-md"
          style={{ left: pos.x, top: pos.y, transform: pos.cima ? "translateY(-100%)" : undefined }}>
          {explica}
        </span>
      )}
    </span>
  );
}
