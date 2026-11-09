import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, Hourglass } from "lucide-react";
import { buscarProposicoes, temasCamara, type Busca } from "@/lib/proposicoes.functions";
import { Fontes, Selo } from "@/components/Fontes";
import { Escolha } from "@/components/Escolha";
import { GRUPOS, grupoSituacao, diasParada, type Grupo } from "@/lib/situacao";

const COR: Record<Grupo, string> = { aprovada: "var(--official)", votacao: "var(--chart-1)", analise: "var(--chart-3)", "sem-analise": "var(--chart-2)", arquivada: "var(--muted-foreground)", encerrada: "var(--destructive)", desconhecida: "var(--border)" };
const FINAL: Grupo[] = ["aprovada", "arquivada", "encerrada"];
function SeloSituacao({ situacao, data }: { situacao: string; data: string }) {
  const g = grupoSituacao(situacao); const dias = diasParada(data);
  const parada = !FINAL.includes(g) && dias != null && dias > 180;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide" style={{ borderColor: COR[g], color: g === "desconhecida" ? undefined : COR[g] }} title={situacao || undefined}>
        <span className="h-2 w-2 rounded-full" style={{ background: COR[g] }} aria-hidden />{GRUPOS[g].rotulo}
      </span>
      {parada && <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-destructive"><Hourglass className="h-3 w-3" aria-hidden />Parada há {dias! > 730 ? `${Math.floor(dias! / 365)} anos` : `${Math.floor(dias! / 30)} meses`}</span>}
    </span>
  );
}

const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const busca = (b: Busca) => queryOptions({ queryKey: ["busca-prop", b], queryFn: () => buscarProposicoes({ data: b }), staleTime: 600_000 });

export const Route = createFileRoute("/proposicoes")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    casa: str(s["casa"]) === "senado" ? "senado" : "camara", q: str(s["q"]), tipo: str(s["tipo"]), numero: str(s["numero"]), ano: str(s["ano"]),
    autor: str(s["autor"]), tema: str(s["tema"]), tramitando: str(s["tramitando"]), pagina: Math.max(1, Number(s["pagina"]) || 1),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(busca(deps)),
  head: () => ({ meta: [
    { title: "Projetos de lei e proposições — Plenário Aberto" },
    { name: "description", content: "Busque projetos de lei, PECs e outras proposições da Câmara e do Senado por palavra, número, autor, tema ou situação." },
    { property: "og:title", content: "Busca de projetos de lei — Plenário Aberto" },
    { property: "og:description", content: "Autores, relatores, tramitação, votações e textos oficiais de cada proposição." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  errorComponent: ({ error }) => <p role="alert">Não foi possível buscar agora: {(error as Error).message}</p>,
  component: Pagina,
});

const campo = "border border-input bg-card px-3 py-2";
const TIPOS = ["PL", "PEC", "PLP", "MPV", "PDL", "PDC", "PRC", "PLV", "REQ"];

function Pagina() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/proposicoes" });
  const [f, setF] = useState(s);
  const { data } = useSuspenseQuery({ ...busca(s), initialData: Route.useLoaderData() });
  const temas = useQuery({ queryKey: ["temas"], queryFn: () => temasCamara(), staleTime: 86400_000, enabled: f.casa === "camara" });
  const set = (k: keyof Busca) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const ir = (p: Partial<Busca>) => nav({ search: { ...f, ...p } });
  return (
    <div>
      <h1 className="text-4xl font-bold">Projetos de lei e proposições</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Procure por palavra da ementa, por tipo, número e ano (ex.: PL 2338/2023), pelo nome de quem apresentou, por tema ou situação.</p>
      <form className="mt-6 grid gap-3 md:grid-cols-6" onSubmit={(e) => { e.preventDefault(); ir({ pagina: 1 }); }}>
        <Escolha rotulo="Casa" value={f.casa} onChange={(v) => setF({ ...f, casa: v, tema: "", tramitando: "" })} opcoes={[{ v: "camara", l: "Câmara" }, { v: "senado", l: "Senado" }]} />
        <input className={`${campo} md:col-span-5`} placeholder="Palavra-chave (ex.: inteligência artificial)" value={f.q} onChange={set("q")} aria-label="Palavra-chave" />
        <Escolha rotulo="Tipo" value={f.tipo} onChange={(v) => setF({ ...f, tipo: v })} opcoes={[{ v: "", l: "Todos os tipos" }, ...TIPOS.map((t) => ({ v: t, l: t }))]} />
        <input className={campo} placeholder="Número" inputMode="numeric" value={f.numero} onChange={set("numero")} aria-label="Número" />
        <input className={campo} placeholder="Ano" inputMode="numeric" value={f.ano} onChange={set("ano")} aria-label="Ano" />
        <input className={`${campo} md:col-span-2`} placeholder="Autor (nome)" value={f.autor} onChange={set("autor")} aria-label="Autor" />
        {f.casa === "camara" ? (
          <Escolha rotulo="Tema" value={f.tema} onChange={(v) => setF({ ...f, tema: v })} opcoes={[{ v: "", l: "Todos os temas" }, ...(temas.data ?? []).map((t) => ({ v: t.cod, l: t.nome }))]} />
        ) : (
          <Escolha rotulo="Situação" value={f.tramitando} onChange={(v) => setF({ ...f, tramitando: v })} opcoes={[{ v: "", l: "Qualquer situação" }, { v: "S", l: "Em tramitação" }, { v: "N", l: "Encerradas" }]} />
        )}
        <button className="flex items-center justify-center gap-2 bg-primary px-4 py-2 font-medium text-primary-foreground md:col-span-6 md:justify-self-start"><Search className="h-4 w-4" aria-hidden />Buscar</button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        {data.erro || `${(data.total ?? 0).toLocaleString("pt-BR")} resultado(s) · página ${s.pagina} de ${Math.max(1, data.paginas)}`}
        {!s.ano && !s.numero && s.casa === "senado" && !s.q && !s.autor && !s.tipo ? " Sem filtros, mostramos as do ano atual." : ""}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {(Object.keys(GRUPOS) as Grupo[]).filter((g) => g !== "desconhecida").map((g) => <span key={g} className="inline-flex items-center gap-1.5" title={GRUPOS[g].explica}><span className="h-2 w-2 rounded-full" style={{ background: COR[g] }} aria-hidden />{GRUPOS[g].rotulo}</span>)}
        <span className="inline-flex items-center gap-1 text-destructive"><Hourglass className="h-3 w-3" aria-hidden />Parada: sem movimentação há mais de 6 meses</span>
        <Selo tipo="calculo" explica="Agrupamos a situação oficial de cada proposição por palavras do texto publicado pela fonte (ex.: 'Arquivada', 'Aguardando Designação de Relator', 'Pronta para Pauta'). 'Parada' significa que a última mudança de situação foi há mais de 180 dias. A situação oficial completa aparece logo abaixo de cada selo." />
      </div>
      <ul className="mt-3 divide-y divide-border border-y border-border">
        {data.itens.map((p) => (
          <li key={p.id}>
            <Link to="/proposicao/$casa/$id" params={{ casa: p.casa, id: p.id }} className="block border-l-4 py-4 pl-4 hover:bg-muted/50" style={{ borderColor: COR[grupoSituacao(p.situacao)] }}>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <FileText className="h-4 w-4 self-center text-primary" aria-hidden />
                <span className="font-bold">{p.identificacao}</span>
                <span className="text-sm text-muted-foreground">{p.data.split("-").reverse().join("/")}</span>
              </div>
              <div className="mt-1"><SeloSituacao situacao={p.situacao} data={p.dataSituacao} /></div>
              {p.situacao && <p className="mt-1 text-xs text-muted-foreground">Situação oficial: {p.situacao}{p.dataSituacao && ` · desde ${p.dataSituacao.split("-").reverse().join("/")}`}</p>}
              <p className="mt-1 line-clamp-2">{p.ementa}</p>
              {p.autoria && <p className="mt-1 text-sm text-muted-foreground">{p.autoria}</p>}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-3">
        <button disabled={s.pagina <= 1} onClick={() => nav({ search: { ...s, pagina: 1 } })} aria-label="Primeira página" className="border border-input px-2 py-1 disabled:opacity-40"><ChevronsLeft className="h-4 w-4" aria-hidden /></button>
        <button disabled={s.pagina <= 1} onClick={() => nav({ search: { ...s, pagina: s.pagina - 1 } })} className="flex items-center gap-1 border border-input px-3 py-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden />Anterior</button>
        <span className="text-sm">Página {s.pagina} de {Math.max(1, data.paginas)} · {(data.total ?? 0).toLocaleString("pt-BR")} resultados</span>
        <button disabled={!data.temMais} onClick={() => nav({ search: { ...s, pagina: s.pagina + 1 } })} className="flex items-center gap-1 border border-input px-3 py-1 disabled:opacity-40">Próxima<ChevronRight className="h-4 w-4" aria-hidden /></button>
        <button disabled={!data.temMais} onClick={() => nav({ search: { ...s, pagina: data.paginas } })} aria-label="Última página" className="border border-input px-2 py-1 disabled:opacity-40"><ChevronsRight className="h-4 w-4" aria-hidden /></button>
      </div>
      <Fontes fontes={data.fontes} />
    </div>
  );
}
