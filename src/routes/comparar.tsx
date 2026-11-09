import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { GitCompare, X, Plus } from "lucide-react";
import { parlamentaresQuery } from "@/lib/parlamentares-query";
import { compararParlamentares } from "@/lib/alinhamento.functions";
import { Fontes, Selo } from "@/components/Fontes";

type S = { casa: string; ano: number; ids: string };
const ANO = new Date().getFullYear();
export const Route = createFileRoute("/comparar")({
  validateSearch: (s: Record<string, unknown>): S => ({ casa: s["casa"] === "senado" ? "senado" : "camara", ano: Number(s["ano"]) || ANO, ids: typeof s["ids"] === "string" ? s["ids"] : typeof s["ids"] === "number" ? String(s["ids"]) : "" }),
  loader: ({ context }) => context.queryClient.ensureQueryData(parlamentaresQuery),
  head: () => ({ meta: [
    { title: "Comparar votos de parlamentares — Plenário Aberto" },
    { name: "description", content: "Compare até quatro deputados ou senadores: quantas vezes votaram igual, onde divergiram e quanto seguem o próprio partido." },
    { property: "og:title", content: "Comparar perfis de votação — Plenário Aberto" },
    { property: "og:description", content: "Concordância e divergências nas votações nominais do plenário, com fonte oficial." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Comparar,
});

const campo = "border border-input bg-card px-3 py-2";
const corVoto = (v: string) => (v === "Sim" ? "text-primary font-bold" : v === "Não" ? "font-bold" : "text-muted-foreground");

function Comparar() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/comparar" });
  const { data: lista } = useSuspenseQuery({ ...parlamentaresQuery, initialData: Route.useLoaderData() });
  const ids = s.ids.split(",").filter(Boolean).slice(0, 4);
  const daCasa = useMemo(() => lista.lista.filter((p) => p.casa === s.casa), [lista, s.casa]);
  const [busca, setBusca] = useState("");
  const [soDiv, setSoDiv] = useState(true);
  const setIds = (n: string[]) => nav({ search: { ...s, ids: n.join(",") } });
  const r = useQuery({ queryKey: ["comparar", s.casa, s.ano, ids.join(",")], queryFn: () => compararParlamentares({ data: { casa: s.casa, ano: s.ano, ids } }), enabled: ids.length >= 2, staleTime: 3600_000 });
  const nome = (id: string) => daCasa.find((p) => p.id === id)?.nome ?? r.data?.perfis.find((p) => p.id === id)?.nome ?? id;
  const sugestoes = busca.length >= 2 ? daCasa.filter((p) => !ids.includes(p.id) && `${p.nome} ${p.partido} ${p.uf}`.toLowerCase().includes(busca.toLowerCase())).slice(0, 8) : [];
  const vots = (r.data?.votacoes ?? []).filter((v) => !soDiv || v.diverge);
  return (
    <div>
      <h1 className="flex items-center gap-3 text-4xl font-bold"><GitCompare className="h-8 w-8 text-primary" aria-hidden />Comparar perfis de votação</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Escolha de dois a quatro parlamentares da mesma casa. Comparamos só as votações nominais do plenário em que cada um votou Sim ou Não.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <select className={campo} value={s.casa} onChange={(e) => nav({ search: { casa: e.target.value, ano: s.ano, ids: "" } })} aria-label="Casa"><option value="camara">Câmara</option><option value="senado">Senado</option></select>
        <select className={campo} value={s.ano} onChange={(e) => nav({ search: { ...s, ano: Number(e.target.value) } })} aria-label="Ano">{[ANO, ANO - 1, ANO - 2, ANO - 3].map((a) => <option key={a}>{a}</option>)}</select>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {ids.map((id) => <span key={id} className="flex items-center gap-1 border border-foreground px-2 py-1">{nome(id)}<button onClick={() => setIds(ids.filter((x) => x !== id))} aria-label={`Remover ${nome(id)}`}><X className="h-4 w-4" aria-hidden /></button></span>)}
        {ids.length < 4 && (
          <div className="relative">
            <div className="flex items-center gap-1"><Plus className="h-4 w-4" aria-hidden /><input className={campo} placeholder="Adicionar parlamentar" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Adicionar parlamentar" /></div>
            {sugestoes.length > 0 && <ul className="absolute z-10 mt-1 w-80 border border-border bg-card shadow">{sugestoes.map((p) => <li key={p.id}><button className="w-full px-3 py-2 text-left hover:bg-muted" onClick={() => { setIds([...ids, p.id]); setBusca(""); }}>{p.nome} <span className="text-muted-foreground">({p.partido}-{p.uf})</span></button></li>)}</ul>}
          </div>
        )}
      </div>

      {ids.length < 2 ? <p className="mt-8 text-muted-foreground">Adicione pelo menos dois parlamentares para comparar.</p>
        : r.isLoading ? <p className="mt-8 text-muted-foreground">Lendo os votos oficiais de {s.ano}… a primeira consulta do ano pode levar alguns segundos.</p>
        : r.error ? <p role="alert" className="mt-8">Não foi possível comparar agora: {(r.error as Error).message}</p>
        : r.data && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {r.data.perfis.map((p) => (
                <div key={p.id} className="border-2 border-foreground p-4">
                  {s.casa === "camara" ? <Link to="/deputado/$id" params={{ id: p.id }} className="font-bold underline">{p.nome}</Link> : <Link to="/senador/$id" params={{ id: p.id }} className="font-bold underline">{p.nome}</Link>}
                  <p className="text-sm text-muted-foreground">{p.partido}-{p.uf}</p>
                  <p className="mt-3 text-3xl font-bold">{p.total}<span className="text-sm font-normal text-muted-foreground"> de {p.totalVotacoes} votações</span></p>
                  <p className="text-sm">Sim {p.sim} · Não {p.nao} · Outros {p.outros}</p>
                  <p className="mt-2 text-sm">Segue a maioria do partido: <b>{p.fidelidade == null ? "—" : `${p.fidelidade}%`}</b></p>
                </div>
              ))}
            </div>
            <section className="mt-8">
              <h2 className="flex items-center gap-2 border-b-2 border-foreground pb-1 text-2xl font-bold">Concordância <Selo tipo="calculo" explica="Para cada dupla, contamos as votações em que os dois votaram Sim ou Não e em quantas votaram igual. Abstenção, obstrução e ausência ficam de fora. 'Segue a maioria do partido' compara o voto com o que a maioria da bancada votou." /></h2>
              <ul className="mt-3 space-y-3">
                {r.data.pares.map((p) => { const pct = p.comum ? Math.round((p.iguais / p.comum) * 100) : 0; return (
                  <li key={p.a + p.b}>
                    <p className="text-sm">{nome(p.a)} × {nome(p.b)}: <b>{p.comum ? `${pct}%` : "sem votações em comum"}</b> <span className="text-muted-foreground">({p.iguais} de {p.comum})</span></p>
                    <div className="mt-1 h-3 w-full bg-muted"><div className="h-3 bg-primary" style={{ width: `${pct}%` }} /></div>
                  </li>); })}
              </ul>
            </section>
            <section className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground pb-1">
                <h2 className="text-2xl font-bold">Votações ({vots.length})</h2>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={soDiv} onChange={(e) => setSoDiv(e.target.checked)} />Só onde divergiram</label>
              </div>
              <div className="overflow-x-auto">
                <table className="mt-2 w-full text-sm">
                  <thead><tr className="text-left"><th className="py-2 pr-3">Data</th><th className="pr-3">Votação</th>{r.data.perfis.map((p) => <th key={p.id} className="pr-3">{p.nome.split(" ")[0]}</th>)}</tr></thead>
                  <tbody>
                    {vots.slice(0, 200).map((v) => (
                      <tr key={v.id} className="border-t border-border align-top">
                        <td className="py-2 pr-3 whitespace-nowrap">{v.data.split("-").reverse().join("/")}</td>
                        <td className="pr-3">{v.idProp ? <Link to="/proposicao/$casa/$id" params={{ casa: s.casa, id: v.idProp }} className="underline">{v.identificacao || "Ver proposição"}</Link> : v.identificacao} <span className="line-clamp-2">{v.descricao}</span></td>
                        {v.votos.map((x, i) => <td key={i} className={`pr-3 ${corVoto(x)}`}>{x || "—"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {vots.length > 200 && <p className="mt-2 text-sm text-muted-foreground">Mostrando as 200 mais recentes.</p>}
            </section>
            <Fontes fontes={r.data.fontes} />
          </>
        )}
    </div>
  );
}
