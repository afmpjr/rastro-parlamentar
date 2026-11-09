import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { GitCompare, X, Plus } from "lucide-react";
import { parlamentaresQuery } from "@/lib/parlamentares-query";
import { compararParlamentares } from "@/lib/alinhamento.functions";
import { Fontes, Selo } from "@/components/Fontes";
import { Escolha } from "@/components/Escolha";
import { foto } from "@/lib/foto";

type S = { casa: string; ano: number; ids: string };
const ANO = new Date().getFullYear();
export const Route = createFileRoute("/comparar")({
  validateSearch: (s: Record<string, unknown>): S => ({ casa: s["casa"] === "senado" ? "senado" : "camara", ano: Number(s["ano"]) || ANO, ids: typeof s["ids"] === "string" ? s["ids"] : typeof s["ids"] === "number" ? String(s["ids"]) : "" }),
  loader: ({ context }) => context.queryClient.ensureQueryData(parlamentaresQuery),
  head: () => ({ meta: [
    { title: "Comparar votos de parlamentares — Plenário Aberto" },
    { name: "description", content: "Compare até três deputados ou senadores: quantas vezes votaram igual, onde divergiram e quanto seguem o próprio partido." },
    { property: "og:title", content: "Comparar perfis de votação — Plenário Aberto" },
    { property: "og:description", content: "Concordância e divergências nas votações nominais do plenário, com fonte oficial." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Comparar,
});

const campo = "border border-input bg-card px-3 py-2";
const corVoto = (v: string) => (v === "Sim" ? "text-primary font-bold" : v === "Não" ? "font-bold" : "text-muted-foreground");

function Slot({ opcoes, onPick, rotulo }: { opcoes: { id: string; nome: string; partido: string; uf: string }[]; onPick: (id: string) => void; rotulo: string }) {
  const [b, setB] = useState("");
  const sug = b.length >= 2 ? opcoes.filter((p) => `${p.nome} ${p.partido} ${p.uf}`.toLowerCase().includes(b.toLowerCase())).slice(0, 8) : [];
  return (
    <div className="relative">
      <div className="flex aspect-[3/4] w-full items-center justify-center border-2 border-dashed border-border text-muted-foreground"><Plus className="h-8 w-8" aria-hidden /></div>
      <input className={`${campo} mt-2 w-full`} placeholder={rotulo} value={b} onChange={(e) => setB(e.target.value)} aria-label={rotulo} />
      {sug.length > 0 && <ul className="absolute z-10 mt-1 w-full border border-border bg-card shadow">{sug.map((p) => <li key={p.id}><button className="w-full px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { onPick(p.id); setB(""); }}>{p.nome} <span className="text-muted-foreground">({p.partido}-{p.uf})</span></button></li>)}</ul>}
    </div>
  );
}

function Comparar() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/comparar" });
  const { data: lista } = useSuspenseQuery({ ...parlamentaresQuery, initialData: Route.useLoaderData() });
  const ids = s.ids.split(",").filter(Boolean).slice(0, 3);
  const daCasa = useMemo(() => lista.lista.filter((p) => p.casa === s.casa), [lista, s.casa]);
  const [soDiv, setSoDiv] = useState(true);
  const [dif, setDif] = useState(false);
  const setIds = (n: string[]) => nav({ search: { ...s, ids: n.join(",") } });
  const r = useQuery({ queryKey: ["comparar", s.casa, s.ano, ids.join(",")], queryFn: () => compararParlamentares({ data: { casa: s.casa, ano: s.ano, ids } }), enabled: ids.length >= 1, staleTime: 3600_000 });
  const info = (id: string) => daCasa.find((p) => p.id === id);
  const perfil = (id: string) => r.data?.perfis.find((p) => p.id === id);
  const nome = (id: string) => info(id)?.nome ?? perfil(id)?.nome ?? id;
  const slots = [0, 1, 2].map((i) => ids[i] ?? "");
  const livres = daCasa.filter((p) => !ids.includes(p.id));
  const pct = (a: string, b: string) => { const p = r.data?.pares.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a)); return p && p.comum ? `${Math.round((p.iguais / p.comum) * 100)}%` : "—"; };
  const carregando = r.isLoading && ids.length > 0;
  const val = (id: string, f: (p: NonNullable<ReturnType<typeof perfil>>) => string) => { if (!id) return ""; const p = perfil(id); return p ? f(p) : carregando ? "…" : "—"; };
  type Linha = { rotulo: string; v: (id: string) => string };
  const secoes: { titulo: string; linhas: Linha[] }[] = [
    { titulo: "Perfil", linhas: [
      { rotulo: "Partido", v: (id) => (id ? info(id)?.partido ?? perfil(id)?.partido ?? "" : "") },
      { rotulo: "Estado", v: (id) => (id ? info(id)?.uf ?? perfil(id)?.uf ?? "" : "") },
      { rotulo: "Casa", v: (id) => (id ? (s.casa === "camara" ? "Câmara" : "Senado") : "") },
    ] },
    { titulo: `Votações ${s.ano}`, linhas: [
      { rotulo: "Participou de", v: (id) => val(id, (p) => `${p.total} de ${p.totalVotacoes}`) },
      { rotulo: "Presença", v: (id) => val(id, (p) => (p.totalVotacoes ? `${Math.round((p.total / p.totalVotacoes) * 100)}%` : "—")) },
      { rotulo: "Votou Sim", v: (id) => val(id, (p) => String(p.sim)) },
      { rotulo: "Votou Não", v: (id) => val(id, (p) => String(p.nao)) },
      { rotulo: "Outros votos", v: (id) => val(id, (p) => String(p.outros)) },
      { rotulo: "Segue o partido", v: (id) => val(id, (p) => (p.fidelidade == null ? "—" : `${p.fidelidade}%`)) },
    ] },
    { titulo: "Concordância", linhas: slots.filter(Boolean).map((o) => ({ rotulo: `Com ${nome(o).split(" ")[0]}`, v: (id: string) => (!id ? "" : id === o ? "—" : carregando ? "…" : pct(id, o)) })) },
  ];
  const vots = (r.data?.votacoes ?? []).filter((v) => !soDiv || v.diverge);
  const cols = "grid grid-cols-[8rem_repeat(3,minmax(0,1fr))] gap-x-3 md:grid-cols-[11rem_repeat(3,minmax(0,1fr))]";
  return (
    <div>
      <h1 className="flex items-center gap-3 text-4xl font-bold"><GitCompare className="h-8 w-8 text-primary" aria-hidden />Comparar parlamentares</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Coloque até três parlamentares da mesma casa lado a lado. Os números de votação consideram as votações nominais do plenário no ano escolhido.</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Escolha className="w-40" rotulo="Casa" value={s.casa} onChange={(v) => nav({ search: { casa: v, ano: s.ano, ids: "" } })} opcoes={[{ v: "camara", l: "Câmara" }, { v: "senado", l: "Senado" }]} />
        <Escolha className="w-28" rotulo="Ano" value={String(s.ano)} onChange={(v) => nav({ search: { ...s, ano: Number(v) } })} opcoes={[ANO, ANO - 1, ANO - 2, ANO - 3].map((a) => ({ v: String(a), l: String(a) }))} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dif} onChange={(e) => setDif(e.target.checked)} />Destacar diferenças</label>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[640px]">
          <div className={`${cols} border-b-2 border-foreground pb-4`}>
            <div />
            {slots.map((id, i) => id ? (
              <div key={id} className="relative">
                <button onClick={() => setIds(ids.filter((x) => x !== id))} aria-label={`Remover ${nome(id)}`} className="absolute right-1 top-1 bg-background/90 p-1"><X className="h-4 w-4" aria-hidden /></button>
                {info(id)?.foto ? <img src={foto(info(id)!.foto)} alt="" className="aspect-[3/4] w-full border border-border object-cover" /> : <div className="aspect-[3/4] w-full bg-muted" />}
                {s.casa === "camara" ? <Link to="/deputado/$id" params={{ id }} className="mt-2 block font-bold underline">{nome(id)}</Link> : <Link to="/senador/$id" params={{ id }} className="mt-2 block font-bold underline">{nome(id)}</Link>}
              </div>
            ) : <Slot key={`v${i}`} opcoes={livres} onPick={(n) => setIds([...ids, n])} rotulo={ids.length ? "Comparar com…" : "Buscar parlamentar"} />)}
          </div>
          {secoes.map((sec) => sec.linhas.length > 0 && (
            <div key={sec.titulo}>
              <h2 className="mt-6 flex items-center gap-2 pb-1 text-lg font-bold text-primary">{sec.titulo}{sec.titulo !== "Perfil" && <Selo tipo="calculo" explica="Contamos as votações nominais do plenário em que cada um registrou voto. Presença é a parte dessas votações em que votou. 'Segue o partido' compara o voto Sim/Não com o que a maioria da bancada votou. Concordância é a parte das votações em comum (os dois com Sim ou Não) em que votaram igual." />}</h2>
              {sec.linhas.map((l) => { const vs = slots.map((id) => l.v(id)); const cheios = vs.filter(Boolean); const difere = dif && cheios.length > 1 && new Set(cheios).size > 1; return (
                <div key={l.rotulo} className={`${cols} border-t border-border py-2 text-sm ${difere ? "bg-highlight/40" : ""}`}>
                  <div className="font-semibold text-muted-foreground">{l.rotulo}</div>
                  {vs.map((x, i) => <div key={i}>{x}</div>)}
                </div>); })}
            </div>
          ))}
        </div>
      </div>
      {r.error && <p role="alert" className="mt-6">Não foi possível comparar agora: {(r.error as Error).message}</p>}

      {r.data && ids.length >= 2 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground pb-1">
            <h2 className="text-2xl font-bold">Votação a votação ({vots.length})</h2>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={soDiv} onChange={(e) => setSoDiv(e.target.checked)} />Só onde divergiram</label>
          </div>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full text-sm">
              <thead><tr className="text-left"><th className="py-2 pr-3">Data</th><th className="pr-3">Votação</th>{r.data.perfis.map((p) => <th key={p.id} className="pr-3">{p.nome.split(" ")[0]}</th>)}</tr></thead>
              <tbody>
                {vots.slice(0, 200).map((v) => (
                  <tr key={v.id} className="border-t border-border align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{v.data.split("-").reverse().join("/")}</td>
                    <td className="py-2 pr-3">
                      {v.idProp ? <Link to="/proposicao/$casa/$id" params={{ casa: s.casa, id: v.idProp }} className="font-bold underline">{v.identificacao || "Ver proposição"}</Link> : <span className="font-bold">{v.identificacao}</span>}
                      {v.ementa && <p className="line-clamp-2">{v.ementa}</p>}
                      {v.decidia && <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">Em votação: {v.decidia}</p>}
                      <p className="text-xs text-muted-foreground">{v.descricao}</p>
                    </td>
                    {v.votos.map((x, i) => <td key={i} className={`pr-3 ${corVoto(x)}`}>{x || "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {vots.length > 200 && <p className="mt-2 text-sm text-muted-foreground">Mostrando as 200 mais recentes.</p>}
        </section>
      )}
      {r.data && <Fontes fontes={r.data.fontes} />}
    </div>
  );
}
