import { createFileRoute, Link } from "@tanstack/react-router";
import { foto } from "@/lib/foto";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { listarMunicipios } from "@/lib/municipios.functions";
import { NOMES_UF } from "@/lib/ufs";
import { useMemo, useState } from "react";
import { parlamentaresQuery } from "@/lib/parlamentares-query";
import { Fontes } from "@/components/Fontes";
import { Escolha } from "@/components/Escolha";

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
  const mun = useQuery({ queryKey: ["municipios"], queryFn: () => listarMunicipios(), staleTime: 864e5 });
  const filtrar = (texto: string, ufs?: string[]) => data.lista.filter((p) =>
    (!casa || p.casa === casa) && (!partido || p.partido === partido) && (!uf || p.uf === uf) &&
    (ufs ? ufs.includes(p.uf) : !texto || norm(`${p.nome} ${p.partido} ${p.uf}`).includes(norm(texto))));
  const porNome = filtrar(q);
  const cidades = q.trim().length >= 3 && porNome.length === 0 ? (mun.data?.lista ?? []).filter((m) => norm(m.nome) === norm(q.trim())) : [];
  const cidadeUfs = [...new Set(cidades.map((c) => c.uf))];
  const f = cidades.length ? filtrar("", cidadeUfs) : porNome;
  return (
    <div>
      <h1 className="text-4xl font-bold">Parlamentares</h1>
      <div className="mt-6 flex flex-wrap gap-3">
        <input className={`${sel} min-w-64 flex-1`} placeholder="Nome, partido ou sua cidade" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
        <Escolha className="w-48" rotulo="Casa" value={casa} onChange={setCasa} opcoes={[{ v: "", l: "Câmara e Senado" }, { v: "camara", l: "Câmara" }, { v: "senado", l: "Senado" }]} />
        <Escolha className="w-48" rotulo="Partido" value={partido} onChange={setPartido} opcoes={[{ v: "", l: "Todos os partidos" }, ...partidos.map((p) => ({ v: p, l: p }))]} />
        <Escolha className="w-40" rotulo="UF" value={uf} onChange={setUf} opcoes={[{ v: "", l: "Todas as UFs" }, ...ufs.map((p) => ({ v: p, l: p }))]} />
      </div>
      {cidades.length > 0 && (
        <div className="mt-6 border-l-4 border-primary bg-card p-5" role="status">
          <p className="text-lg font-semibold">Você buscou por {cidades.map((c) => `${c.nome} (${NOMES_UF[c.uf] ?? c.uf})`).join(" ou ")}.</p>
          <p className="mt-2 max-w-3xl">No Congresso, deputados federais e senadores não representam uma cidade só: são eleitos por todo o estado. Abaixo estão os {f.filter((p) => p.casa === "camara").length} deputados e {f.filter((p) => p.casa === "senado").length} senadores que representam a sua cidade e região.</p>
          <Link to="/emendas" search={{ ano: 0, uf: "", municipio: cidades[0]!.nome, autor: "" }} className="mt-3 inline-block font-semibold text-primary underline">Ver o dinheiro de emendas enviado para {cidades[0]!.nome} →</Link>
        </div>
      )}
      {q.trim().length >= 3 && f.length === 0 && (
        <p className="mt-6 max-w-3xl bg-card p-5">Nenhum parlamentar ou cidade encontrado para “{q}”. Tente o nome de um deputado, de um partido ou da sua cidade, escrito por extenso.</p>
      )}
      <p className="label-caps mt-4">{f.length} resultados</p>
      <ul className="mt-4 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
        {f.map((p) => (
          <li key={p.casa + p.id} className="bg-background">
            <Link to={p.casa === "camara" ? "/deputado/$id" : "/senador/$id"} params={{ id: p.id }} className="flex items-center gap-3 p-3 hover:bg-secondary">
              <img src={foto(p.foto)} alt="" loading="lazy" className="h-14 w-11 object-cover grayscale" />
              <div><div className="font-semibold">{p.nome}</div><div className="text-sm text-muted-foreground">{p.partido} · {p.uf} · {p.casa === "camara" ? "Deputado(a)" : "Senador(a)"}</div></div>
            </Link>
          </li>
        ))}
      </ul>
      <Fontes fontes={cidades.length && mun.data ? [...data.fontes, ...mun.data.fontes] : data.fontes} />
    </div>
  );
}
