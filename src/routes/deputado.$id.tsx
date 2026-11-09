import { createFileRoute } from "@tanstack/react-router";
import { foto } from "@/lib/foto";
import { useState } from "react";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { detalheDeputado, votosDeputado } from "@/lib/fontes.functions";
import { Fontes, Selo } from "@/components/Fontes";
import { ExploradorDespesas } from "@/components/graficos/Despesas";
import { GradeAtividade } from "@/components/graficos/Atividade";
import { PainelVotos } from "@/components/graficos/Votos";
import { DetalheProposicoes } from "@/components/graficos/Proposicoes";
import { Desempenho, contar } from "@/components/graficos/Desempenho";

const q = (id: string) => queryOptions({ queryKey: ["dep", id], queryFn: () => detalheDeputado({ data: { id } }), staleTime: 3600_000 });

export const Route = createFileRoute("/deputado/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(q(params.id)),
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.perfil.nome} (${loaderData.perfil.partido}-${loaderData.perfil.uf}) — Plenário Aberto` : "Deputado — Plenário Aberto";
    const d = "Despesas por categoria e período, agenda, desempenho e proposições de deputado(a) federal, com fonte oficial.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" }] };
  },
  errorComponent: ({ error }) => <p role="alert" className="text-muted-foreground">Não foi possível carregar este perfil agora: {(error as Error).message}</p>,
  notFoundComponent: () => <p>Deputado(a) não encontrado(a).</p>,
  component: Dep,
});

function Dep() {
  const { id } = Route.useParams();
  const inicial = Route.useLoaderData();
  const { data } = useSuspenseQuery({ ...q(id), initialData: inicial });
  const p = data.perfil;
  const anos = contar(data.proposicoes.map((x) => String(x.data).slice(0, 4))).sort((a, b) => a.nome.localeCompare(b.nome));
  const sessoes = data.eventos.filter((e) => /sess/i.test(e.tipo)).length;
  return (
    <article>
      <div className="flex flex-wrap gap-6">
        <img src={foto(p.foto)} alt={p.nome} className="h-40 w-32 border border-foreground object-cover" />
        <div>
          <p className="label-caps">Deputado(a) federal · Legislatura {p.legislatura} <Selo tipo="oficial" /></p>
          <h1 className="mt-1 text-5xl font-bold">{p.nome}</h1>
          <p className="mt-2 text-lg">{p.partido} · {p.uf} · {p.situacao}</p>
          <p className="text-sm text-muted-foreground">{p.nomeCivil} · nasc. {p.nascimento} em {p.municipioNascimento} · {p.escolaridade}</p>
          {p.email && <p className="text-sm">{p.email}</p>}
        </div>
      </div>

      <ExploradorDespesas despesas={data.despesas} titulo="Cota parlamentar (CEAP)" />

      <GradeAtividade itens={data.eventos.map((e) => ({ data: e.data, tipo: e.tipo, titulo: `${e.hora} · ${e.orgao || e.tipo}${e.situacao ? ` (${e.situacao})` : ""}`, detalhe: [e.descricao, e.local].filter(Boolean).join(" — "), url: `https://www.camara.leg.br/evento-legislativo/${e.id}` }))} titulo="Agenda e presença em eventos" legenda="eventos" />

      <Desempenho
        indicadores={[
          { rotulo: "Eventos em 12 meses", valor: String(data.eventos.length), icone: "agenda", detalhe: (<ul className="mt-4 max-h-96 divide-y divide-border overflow-y-auto border border-foreground p-4">{[...data.eventos].reverse().map((e) => (
            <li key={e.id} className="py-2 text-sm"><a className="link-evidence font-semibold" href={`https://www.camara.leg.br/evento-legislativo/${e.id}`} target="_blank" rel="noreferrer">{e.data.split("-").reverse().join("/")} {e.hora} · {e.tipo}</a> <span className="text-muted-foreground">{e.orgao} {e.situacao}</span><p>{e.descricao}</p></li>))}</ul>) },
          { rotulo: "Sessões em plenário", valor: String(sessoes), icone: "votos", detalhe: (<ul className="mt-4 max-h-96 divide-y divide-border overflow-y-auto border border-foreground p-4">{data.eventos.filter((e) => /sess/i.test(e.tipo)).reverse().map((e) => (
            <li key={e.id} className="py-2 text-sm"><a className="link-evidence font-semibold" href={`https://www.camara.leg.br/evento-legislativo/${e.id}`} target="_blank" rel="noreferrer">{e.data.split("-").reverse().join("/")} {e.hora} · {e.tipo}</a> <span className="text-muted-foreground">{e.orgao} {e.situacao}</span><p>{e.descricao}</p></li>))}</ul>) },
          { rotulo: "Proposições (últimas 100)", valor: String(data.proposicoes.length), icone: "propostas", detalhe: <DetalheProposicoes props={data.proposicoes} /> },
          { rotulo: "Tipos de proposição", valor: String(new Set(data.proposicoes.map((x) => x.tipo)).size), icone: "tendencia", detalhe: <DetalheProposicoes props={data.proposicoes} porTipo /> },
        ]}
        barras={{ titulo: "Proposições por ano", dados: anos }}
        pizza={{ titulo: "Eventos por tipo", dados: contar(data.eventos.map((e) => e.tipo)) }}
      />

      <VotosDep id={id} />

      <section className="mt-12">
        <h2 className="flex items-center gap-2 border-b-2 border-foreground pb-1 text-2xl font-bold"><FileText className="h-6 w-6" aria-hidden />Proposições de autoria recentes</h2>
        <ul className="mt-2 divide-y divide-border">{data.proposicoes.slice(0, 15).map((x) => (
          <li key={x.id} className="py-3"><a className="font-semibold link-evidence" href={`https://www.camara.leg.br/propostas-legislativas/${x.id}`} target="_blank" rel="noreferrer">{x.sigla}</a>
          <span className="ml-2 text-sm text-muted-foreground">{x.data?.slice(0, 10)}</span><p className="text-sm">{x.ementa}</p></li>))}
          {data.proposicoes.length === 0 && <li className="py-3 text-muted-foreground">Nenhuma proposição retornada.</li>}
        </ul>
      </section>
      <Fontes fontes={data.fontes} />
    </article>
  );
}

function VotosDep({ id }: { id: string }) {
  const atual = new Date().getFullYear();
  const [ano, setAno] = useState(atual);
  const r = useQuery({ queryKey: ["votos", id, ano], queryFn: () => votosDeputado({ data: { id, ano } }), staleTime: 3600_000 });
  return (
    <>
      <PainelVotos carregando={r.isLoading} erro={r.isError ? "Não foi possível ler o arquivo de votações agora." : undefined}
        votos={(r.data?.votos ?? []).map((v) => ({ data: v.data, voto: v.voto, titulo: `${v.orgao} · ${v.proposicao || "Votação"}`, descricao: v.descricao, aprovada: v.aprovada, url: `https://dadosabertos.camara.leg.br/api/v2/votacoes/${v.idVotacao}` }))}
        extra={<label className="text-xs">Ano<br /><select className="border border-border bg-background px-2 py-1 text-sm" value={ano} onChange={(e) => setAno(Number(e.target.value))}>{[0, 1, 2, 3].map((k) => <option key={k} value={atual - k}>{atual - k}</option>)}</select></label>} />
      {r.data && <Fontes fontes={r.data.fontes} />}
    </>
  );
}
