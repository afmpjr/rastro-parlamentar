import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { detalheDeputado, votosDeputado } from "@/lib/fontes.functions";
import { Escolha } from "@/components/Escolha";
import { Fontes } from "@/components/Fontes";
import { ExploradorDespesas } from "@/components/graficos/Despesas";
import { GradeAtividade } from "@/components/graficos/Atividade";
import { PainelVotos } from "@/components/graficos/Votos";
import { DetalheProposicoes } from "@/components/graficos/Proposicoes";
import { Desempenho, contar } from "@/components/graficos/Desempenho";
import {
  brlResumido,
  CabecalhoPerfil,
  CartaoPerfil,
  MetricasResumo,
  NavegacaoPerfil,
  ProposicoesRecentes,
  ResumoDespesas,
  TituloSecao,
  type AbaPerfil,
} from "@/components/PerfilParlamentar";

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
  const [aba, setAba] = useState<AbaPerfil>("visao");
  const p = data.perfil;
  const anoAtual = new Date().getFullYear();
  const anos = contar(data.proposicoes.map((x) => String(x.data).slice(0, 4))).sort((a, b) => a.nome.localeCompare(b.nome));
  const sessoes = data.eventos.filter((e) => /sess/i.test(e.tipo)).length;
  const despesasAno = data.despesas.filter((d) => d.ano === anoAtual).reduce((s, d) => s + d.valor, 0);
  const fontePerfil = data.fontes[0]?.url ?? `https://dadosabertos.camara.leg.br/api/v2/deputados/${id}`;
  const paginaOficial = `https://www.camara.leg.br/deputados/${id}`;
  const atividade = data.eventos.map((e) => ({
    data: e.data,
    tipo: e.tipo,
    titulo: `${e.hora} · ${e.orgao || e.tipo}${e.situacao ? ` (${e.situacao})` : ""}`,
    detalhe: [e.descricao, e.local].filter(Boolean).join(" — "),
    url: `https://www.camara.leg.br/evento-legislativo/${e.id}`,
  }));

  return (
    <article>
      <CabecalhoPerfil
        id={id}
        casa="camara"
        nome={p.nome}
        partido={p.partido}
        uf={p.uf}
        fotoUrl={p.foto}
        funcao={`Deputado(a) federal · Legislatura ${p.legislatura}`}
        fonteUrl={fontePerfil}
        paginaOficial={paginaOficial}
        situacao={p.situacao}
        detalhes={[p.nomeCivil, p.nascimento && `Nascimento: ${p.nascimento.split("-").reverse().join("/")}`, p.municipioNascimento && `Natural de ${p.municipioNascimento}`, p.escolaridade]}
        email={p.email}
      />

      <NavegacaoPerfil valor={aba} aoMudar={setAba} conteudos={{
        visao: (
          <>
            <MetricasResumo itens={[
              { rotulo: "Eventos em 12 meses", valor: String(data.eventos.length), icone: "agenda", tipo: "oficial", fonte: data.fontes[4]?.url },
              { rotulo: "Sessões em plenário", valor: String(sessoes), icone: "votos", tipo: "calculo", explica: "Contagem dos eventos oficiais dos últimos 12 meses cujo tipo contém “sessão”. Não representa, sozinha, uma taxa de presença." },
              { rotulo: "Proposições recentes", valor: String(data.proposicoes.length), icone: "propostas", tipo: "oficial", fonte: data.fontes[3]?.url },
              { rotulo: `Despesas em ${anoAtual}`, valor: brlResumido(despesasAno), icone: "despesas", tipo: "calculo", explica: `Soma dos valores reembolsados pela CEAP em ${anoAtual}, conforme os registros oficiais disponíveis.` },
            ]} />
            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
              <CartaoPerfil><GradeAtividade itens={atividade} titulo="Atividade parlamentar" legenda="eventos" embutido resumo periodoInicial={3} /></CartaoPerfil>
              <ResumoDespesas despesas={data.despesas} aoVerTodas={() => setAba("despesas")} />
            </div>
            <ProposicoesRecentes proposicoes={data.proposicoes} aoVerTodas={() => setAba("proposicoes")} />
          </>
        ),
        despesas: <ExploradorDespesas despesas={data.despesas} titulo="Cota parlamentar (CEAP)" embutido />,
        atividade: (
          <>
            <GradeAtividade itens={atividade} titulo="Agenda e presença em eventos" legenda="eventos" embutido />
            <Desempenho
              indicadores={[
                { rotulo: "Eventos em 12 meses", valor: String(data.eventos.length), icone: "agenda", detalhe: (<ul className="mt-4 max-h-96 divide-y divide-border overflow-y-auto rounded-lg border bg-card p-4">{[...data.eventos].reverse().map((e) => (
                  <li key={e.id} className="py-2 text-sm"><a className="link-evidence font-semibold" href={`https://www.camara.leg.br/evento-legislativo/${e.id}`} target="_blank" rel="noreferrer">{e.data.split("-").reverse().join("/")} {e.hora} · {e.tipo}</a> <span className="text-muted-foreground">{e.orgao} {e.situacao}</span><p>{e.descricao}</p></li>))}</ul>) },
                { rotulo: "Sessões em plenário", valor: String(sessoes), icone: "votos", detalhe: (<ul className="mt-4 max-h-96 divide-y divide-border overflow-y-auto rounded-lg border bg-card p-4">{data.eventos.filter((e) => /sess/i.test(e.tipo)).reverse().map((e) => (
                  <li key={e.id} className="py-2 text-sm"><a className="link-evidence font-semibold" href={`https://www.camara.leg.br/evento-legislativo/${e.id}`} target="_blank" rel="noreferrer">{e.data.split("-").reverse().join("/")} {e.hora} · {e.tipo}</a> <span className="text-muted-foreground">{e.orgao} {e.situacao}</span><p>{e.descricao}</p></li>))}</ul>) },
                { rotulo: "Proposições (últimas 100)", valor: String(data.proposicoes.length), icone: "propostas", detalhe: <DetalheProposicoes props={data.proposicoes} /> },
                { rotulo: "Tipos de proposição", valor: String(new Set(data.proposicoes.map((x) => x.tipo)).size), icone: "tendencia", detalhe: <DetalheProposicoes props={data.proposicoes} porTipo /> },
              ]}
              barras={{ titulo: "Proposições por ano", dados: anos }}
              pizza={{ titulo: "Eventos por tipo", dados: contar(data.eventos.map((e) => e.tipo)) }}
              explicaBarras="Contamos as proposições de autoria do deputado pelo ano de apresentação, a partir da lista oficial de proposições."
              explicaPizza="Contamos os eventos da agenda oficial dos últimos 12 meses por tipo de evento e mostramos a fatia de cada tipo no total."
            />
          </>
        ),
        votacoes: <VotosDep id={id} />,
        proposicoes: (
          <section>
            <TituloSecao icone={FileText} titulo="Proposições de autoria recentes" fonte={data.fontes[3]?.url} />
            <ul className="mt-4 overflow-hidden rounded-lg border bg-card shadow-sm">
              {data.proposicoes.map((x) => (
                <li key={x.id} className="border-b p-4 last:border-b-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <a className="link-evidence font-semibold" href={`https://www.camara.leg.br/propostas-legislativas/${x.id}`} target="_blank" rel="noreferrer">{x.sigla}</a>
                    <time className="text-xs text-muted-foreground">{x.data?.slice(0, 10).split("-").reverse().join("/")}</time>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{x.ementa}</p>
                </li>
              ))}
              {data.proposicoes.length === 0 && <li className="p-4 text-sm text-muted-foreground">Nenhuma proposição retornada.</li>}
            </ul>
          </section>
        ),
      }} />
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
      <PainelVotos carregando={r.isLoading} erro={r.isError ? "Não foi possível ler o arquivo de votações agora." : undefined} embutido
        votos={(r.data?.votos ?? []).map((v) => ({ data: v.data, voto: v.voto, titulo: `${v.orgao} · ${v.proposicao || "Votação"}`, descricao: v.descricao, aprovada: v.aprovada, url: `https://dadosabertos.camara.leg.br/api/v2/votacoes/${v.idVotacao}` }))}
        extra={<div className="text-xs">Ano<br /><Escolha className="h-9 w-28 py-1 text-sm" rotulo="Ano" value={String(ano)} onChange={(v) => setAno(Number(v))} opcoes={[0, 1, 2, 3].map((k) => ({ v: String(atual - k), l: String(atual - k) }))} /></div>} />
      {r.data && <Fontes fontes={r.data.fontes} />}
    </>
  );
}
