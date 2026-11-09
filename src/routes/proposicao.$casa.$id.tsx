import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink, FileText, Users, UserCheck, GitCommitVertical, Vote, ScrollText, ChevronDown } from "lucide-react";
import { detalheProposicao, votosCamara, type Votacao, type Pessoa } from "@/lib/proposicoes.functions";
import { Fontes, Selo } from "@/components/Fontes";

const q = (casa: string, id: string) => queryOptions({ queryKey: ["prop", casa, id], queryFn: () => detalheProposicao({ data: { casa, id } }), staleTime: 3600_000 });

export const Route = createFileRoute("/proposicao/$casa/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(q(params.casa, params.id)),
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.identificacao} — ${loaderData.ementa.slice(0, 60)} — Plenário Aberto` : "Proposição — Plenário Aberto";
    const d = loaderData ? `${loaderData.ementa.slice(0, 150)} Autores, relatores, tramitação e votações.` : "Autores, relatores, tramitação e votações de uma proposição.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" }] };
  },
  errorComponent: ({ error }) => <p role="alert">Não foi possível carregar esta proposição: {(error as Error).message}</p>,
  component: Prop,
});

const h2 = "flex items-center gap-2 border-b-2 border-foreground pb-1 text-2xl font-bold";
const br = (d: string) => (d ? d.slice(0, 10).split("-").reverse().join("/") : "");

function NomePessoa({ p }: { p: Pessoa }) {
  const txt = `${p.nome}${p.partido ? ` (${p.partido}${p.uf ? `-${p.uf}` : ""})` : ""}`;
  if (p.id && p.casa === "camara") return <Link to="/deputado/$id" params={{ id: p.id }} className="underline">{txt}</Link>;
  if (p.id && p.casa === "senado") return <Link to="/senador/$id" params={{ id: p.id }} className="underline">{txt}</Link>;
  return <span>{txt}</span>;
}

function Prop() {
  const { casa, id } = Route.useParams();
  const { data: d } = useSuspenseQuery({ ...q(casa, id), initialData: Route.useLoaderData() });
  const [tudo, setTudo] = useState(false);
  const tram = tudo ? d.tramitacao : d.tramitacao.slice(0, 15);
  return (
    <article>
      <Link to="/proposicoes" search={{ casa: d.casa, q: "", tipo: "", numero: "", ano: "", autor: "", tema: "", tramitando: "", pagina: 1 }} className="text-sm underline">Voltar à busca</Link>
      <p className="label-caps mt-4">{d.casa === "camara" ? "Câmara dos Deputados" : "Senado Federal"} · {d.tipo}</p>
      <h1 className="text-4xl font-bold">{d.identificacao}</h1>
      <p className="mt-3 max-w-3xl text-lg">{d.ementa}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <Selo tipo="oficial" url={d.linkOficial} />
        <a href={d.linkOficial} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline"><ExternalLink className="h-4 w-4" aria-hidden />Página oficial</a>
        {d.inteiroTeor && <a href={d.inteiroTeor} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline"><FileText className="h-4 w-4" aria-hidden />Texto integral</a>}
      </div>

      <dl className="mt-6 grid gap-4 border-y border-border py-4 sm:grid-cols-4">
        <div><dt className="label-caps">Apresentada em</dt><dd>{br(d.apresentacao)}</dd></div>
        <div className="sm:col-span-2"><dt className="label-caps">Situação atual</dt><dd>{d.situacao || "Não informada"}{d.dataSituacao && ` · ${br(d.dataSituacao)}`}</dd></div>
        <div><dt className="label-caps">{d.norma ? "Virou norma" : "Regime"}</dt><dd>{d.norma || d.regime || "—"}</dd></div>
      </dl>

      <section className="mt-8">
        <h2 className={h2}><ScrollText className="h-5 w-5" aria-hidden />Resumo</h2>
        <p className="mt-3 max-w-3xl">{d.resumo || "A fonte oficial não publica um resumo além da ementa acima. Para o conteúdo completo, abra o texto integral."}</p>
        {d.palavras && <p className="mt-3 text-sm text-muted-foreground"><span className="label-caps">Palavras-chave oficiais: </span>{d.palavras}</p>}
        {d.temas.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{d.temas.map((t) => <span key={t} className="border border-border px-2 py-0.5 text-sm">{t}</span>)}</div>}
      </section>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className={h2}><Users className="h-5 w-5" aria-hidden />Autores</h2>
          <ul className="mt-3 space-y-1">{d.autores.map((p, i) => <li key={i}><span className="label-caps mr-2">{p.papel}</span><NomePessoa p={p} /></li>)}{!d.autores.length && <li className="text-muted-foreground">Não informado.</li>}</ul>
        </section>
        <section>
          <h2 className={h2}><UserCheck className="h-5 w-5" aria-hidden />Relatores</h2>
          <ul className="mt-3 space-y-2">{d.relatores.map((p, i) => <li key={i}><span className="label-caps mr-2">{p.papel}{p.orgao && ` · ${p.orgao}`}</span><NomePessoa p={p} />{(p.desde || p.ate) && <span className="text-sm text-muted-foreground"> · {br(p.desde)}{p.ate && ` a ${br(p.ate)}`}</span>}</li>)}
            {!d.relatores.length && <li className="text-muted-foreground">Nenhum relator designado nas fontes.</li>}</ul>
          {d.casa === "camara" && d.relatores.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Na Câmara, os relatores anteriores são lidos do texto das tramitações ("Designado Relator...").</p>}
        </section>
      </div>

      {d.pareceres.length > 0 && (
        <section className="mt-10">
          <h2 className={h2}><FileText className="h-5 w-5" aria-hidden />Pareceres</h2>
          <ul className="mt-3 divide-y divide-border">{d.pareceres.slice(0, 20).map((p, i) => <li key={i} className="py-2 text-sm"><span className="font-medium">{br(p.data)}</span>{p.orgao && ` · ${p.orgao}`} — {p.descricao}{p.url && <a href={p.url} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 underline"><ExternalLink className="h-3 w-3" aria-hidden />abrir</a>}</li>)}</ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className={h2}><Vote className="h-5 w-5" aria-hidden />Votações</h2>
        {d.votacoes.length ? <ul className="mt-3 space-y-3">{d.votacoes.map((v) => <ItemVotacao key={v.id} v={v} casa={d.casa} />)}</ul>
          : <p className="mt-3 text-muted-foreground">Nenhuma votação registrada nas fontes para esta proposição.</p>}
      </section>

      <section className="mt-10">
        <h2 className={h2}><GitCommitVertical className="h-5 w-5" aria-hidden />Linha do tempo da tramitação</h2>
        <ol className="mt-4 border-l-2 border-primary pl-5">
          {tram.map((p, i) => (
            <li key={i} className="relative pb-4">
              <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-primary" aria-hidden />
              <p className="text-sm"><span className="font-bold">{br(p.data)}</span>{p.orgao && <span className="ml-2 label-caps">{p.orgao}</span>}</p>
              <p className="text-sm">{p.descricao}</p>
              {p.situacao && <p className="text-xs text-muted-foreground">Situação: {p.situacao}</p>}
              {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline"><ExternalLink className="h-3 w-3" aria-hidden />documento</a>}
            </li>
          ))}
        </ol>
        {d.tramitacao.length > 15 && <button onClick={() => setTudo(!tudo)} className="border border-input px-3 py-1 text-sm">{tudo ? "Mostrar menos" : `Mostrar todos os ${d.tramitacao.length} passos`}</button>}
      </section>

      {d.documentos.length > 0 && (
        <section className="mt-10">
          <h2 className={h2}><FileText className="h-5 w-5" aria-hidden />Documentos</h2>
          <ul className="mt-3 space-y-1 text-sm">{d.documentos.map((x, i) => <li key={i}><a href={x.url} target="_blank" rel="noreferrer" className="underline">{br(x.data)} — {x.titulo}</a></li>)}</ul>
        </section>
      )}
      {d.avisos.length > 0 && <p className="mt-6 text-sm text-muted-foreground">Indisponível agora: {d.avisos.join(", ")}.</p>}
      <Fontes fontes={d.fontes} />
    </article>
  );
}

function ItemVotacao({ v, casa }: { v: Votacao; casa: "camara" | "senado" }) {
  const [aberto, setAberto] = useState(false);
  const [filtro, setFiltro] = useState("");
  const r = useQuery({ queryKey: ["votos", v.id], queryFn: () => votosCamara({ data: { id: v.id } }), enabled: aberto && casa === "camara" && !v.votosInline, staleTime: 3600_000 });
  const votos = v.votosInline ?? r.data?.votos ?? [];
  const cont: Record<string, number> = {};
  for (const x of votos) cont[x.voto] = (cont[x.voto] ?? 0) + 1;
  const lista = votos.filter((x) => !filtro || `${x.nome} ${x.partido} ${x.uf} ${x.voto}`.toLowerCase().includes(filtro.toLowerCase()));
  return (
    <li className="border border-border p-3">
      <p className="text-sm"><span className="font-bold">{br(v.data)}</span> · {v.orgao}{v.resultado && <span className={`ml-2 label-caps ${v.resultado === "Aprovada" ? "text-primary" : ""}`}>{v.resultado}</span>}
        {v.sim != null && <span className="ml-2 text-muted-foreground">Sim {v.sim} · Não {v.nao} · Abst. {v.abst}</span>}</p>
      <p className="mt-1 text-sm">{v.descricao}</p>
      <button onClick={() => setAberto(!aberto)} aria-expanded={aberto} className="mt-2 flex items-center gap-1 text-sm underline">
        <ChevronDown className={`h-4 w-4 transition-transform ${aberto ? "rotate-180" : ""}`} aria-hidden />Como cada parlamentar votou
      </button>
      {aberto && (
        <div className="mt-3">
          {r.isLoading ? <p className="text-sm text-muted-foreground">Carregando votos…</p> : !votos.length ? <p className="text-sm text-muted-foreground">Votação simbólica ou sem votos nominais publicados.</p> : (
            <>
              <p className="flex flex-wrap items-center gap-2 text-sm">{Object.entries(cont).sort((a, b) => b[1] - a[1]).map(([k, n]) => <span key={k} className="border border-border px-2">{k}: {n}</span>)}<Selo tipo="calculo" explica="Contamos os votos nominais publicados pela fonte para esta votação, agrupados pelo tipo de voto." /></p>
              <input className="mt-2 w-full border border-input bg-card px-3 py-1 text-sm" placeholder="Filtrar por nome, partido, UF ou voto" value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar votos" />
              <ul className="mt-2 grid max-h-80 gap-x-4 overflow-y-auto text-sm sm:grid-cols-2 lg:grid-cols-3">
                {lista.map((x) => <li key={x.id} className="flex justify-between gap-2 border-b border-border py-1">
                  {casa === "camara" ? <Link to="/deputado/$id" params={{ id: x.id }} className="truncate underline">{x.nome}</Link> : <Link to="/senador/$id" params={{ id: x.id }} className="truncate underline">{x.nome}</Link>}
                  <span className="shrink-0 text-muted-foreground">{x.partido}-{x.uf} · <b className="text-foreground">{x.voto}</b></span></li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </li>
  );
}
