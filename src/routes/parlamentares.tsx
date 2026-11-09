import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { parlamentaresQuery } from "@/lib/parlamentares-query";
import { Fontes } from "@/components/Fontes";

export const Route = createFileRoute("/parlamentares")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s["q"] === "string" ? { q: s["q"] } : {}),
  head: () => ({ meta: [
    { title: "Parlamentares federais — Plenário Aberto" },
    { name: "description", content: "Lista de deputados e senadores em exercício, com filtros por casa, partido e UF." },
    { property: "og:title", content: "Parlamentares federais — Plenário Aberto" },
    { property: "og:description", content: "Deputados e senadores em exercício, direto das fontes oficiais." },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(parlamentaresQuery),
  component: Lista,
});

const sel = "border border-input bg-card px-3 py-2";

function Lista() {
  const { data } = useSuspenseQuery(parlamentaresQuery);
  const { q: q0 } = Route.useSearch();
  const [q, setQ] = useState(q0 ?? "");
  const [casa, setCasa] = useState("");
  const [partido, setPartido] = useState("");
  const [uf, setUf] = useState("");
  const partidos = useMemo(() => [...new Set(data.lista.map((p) => p.partido))].sort(), [data]);
  const ufs = useMemo(() => [...new Set(data.lista.map((p) => p.uf))].sort(), [data]);
  const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const f = data.lista.filter((p) =>
    (!casa || p.casa === casa) && (!partido || p.partido === partido) && (!uf || p.uf === uf) &&
    (!q || norm(`${p.nome} ${p.partido} ${p.uf}`).includes(norm(q))));
  return (
    <div>
      <h1 className="text-4xl font-bold">Parlamentares</h1>
      <div className="mt-6 flex flex-wrap gap-3">
        <input className={`${sel} min-w-64 flex-1`} placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
        <select className={sel} value={casa} onChange={(e) => setCasa(e.target.value)} aria-label="Casa"><option value="">Câmara e Senado</option><option value="camara">Câmara</option><option value="senado">Senado</option></select>
        <select className={sel} value={partido} onChange={(e) => setPartido(e.target.value)} aria-label="Partido"><option value="">Todos os partidos</option>{partidos.map((p) => <option key={p}>{p}</option>)}</select>
        <select className={sel} value={uf} onChange={(e) => setUf(e.target.value)} aria-label="UF"><option value="">Todas as UFs</option>{ufs.map((p) => <option key={p}>{p}</option>)}</select>
      </div>
      <p className="label-caps mt-4">{f.length} resultados</p>
      <ul className="mt-4 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
        {f.map((p) => (
          <li key={p.casa + p.id} className="bg-background">
            <Link to={p.casa === "camara" ? "/deputado/$id" : "/senador/$id"} params={{ id: p.id }} className="flex items-center gap-3 p-3 hover:bg-secondary">
              <img src={p.foto} alt="" loading="lazy" className="h-14 w-11 object-cover grayscale" />
              <div><div className="font-semibold">{p.nome}</div><div className="text-sm text-muted-foreground">{p.partido} · {p.uf} · {p.casa === "camara" ? "Deputado(a)" : "Senador(a)"}</div></div>
            </Link>
          </li>
        ))}
      </ul>
      <Fontes fontes={data.fontes} />
    </div>
  );
}
