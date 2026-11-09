import { Link } from "@tanstack/react-router";
import type { Parlamentar } from "@/lib/fontes.functions";
import { foto } from "@/lib/foto";
import { PartidoLink, UfLink } from "@/components/Rotulos";

export function ListaParlamentares({ lista, titulo }: { lista: Parlamentar[]; titulo: string }) {
  return (
    <section className="mt-8">
      <h2 className="border-b-2 border-foreground pb-1 text-2xl font-bold">{titulo} ({lista.length})</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((p) => (
          <li key={p.casa + p.id} className="flex items-center gap-3 border border-border bg-card p-2">
            {p.foto ? <img src={foto(p.foto)} alt="" className="h-14 w-11 object-cover" loading="lazy" /> : <div className="h-14 w-11 bg-muted" />}
            <div className="min-w-0">
              {p.casa === "camara" ? <Link to="/deputado/$id" params={{ id: p.id }} className="font-semibold underline">{p.nome}</Link> : <Link to="/senador/$id" params={{ id: p.id }} className="font-semibold underline">{p.nome}</Link>}
              <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"><PartidoLink sigla={p.partido} /> · <UfLink uf={p.uf} /> · {p.casa === "camara" ? "Deputado(a)" : "Senador(a)"}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
