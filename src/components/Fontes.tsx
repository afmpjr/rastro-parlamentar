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
            <span className="text-muted-foreground">coletado {new Date(f.coletadoEm).toLocaleString("pt-BR")}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function Selo({ tipo }: { tipo: "oficial" | "calculo" }) {
  return <span className={tipo === "oficial" ? "selo-oficial" : "selo-calculo"}>{tipo === "oficial" ? "Dado oficial" : "Cálculo da plataforma"}</span>;
}
