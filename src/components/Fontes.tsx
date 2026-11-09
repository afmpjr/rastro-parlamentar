import { ExternalLink } from "lucide-react";
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

/** Selo de procedência. Com url, o selo "Dado oficial" abre a fonte numa nova aba. */
export function Selo({ tipo, url }: { tipo: "oficial" | "calculo"; url?: string | undefined }) {
  if (tipo === "oficial" && url)
    return <a href={url} target="_blank" rel="noreferrer" title="Conferir na fonte oficial" className="selo-oficial inline-flex items-center gap-1 hover:underline">Dado oficial<ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only"> (abre em nova aba)</span></a>;
  return <span className={tipo === "oficial" ? "selo-oficial" : "selo-calculo"}>{tipo === "oficial" ? "Dado oficial" : "Cálculo da plataforma"}</span>;
}
