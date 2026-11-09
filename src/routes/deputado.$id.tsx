import { createFileRoute } from "@tanstack/react-router";
import { foto } from "@/lib/foto";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { detalheDeputado } from "@/lib/fontes.functions";
import { Fontes, Selo } from "@/components/Fontes";
import { ExploradorDespesas } from "@/components/graficos/Despesas";
import { GradeAtividade } from "@/components/graficos/Atividade";
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

      <GradeAtividade datas={data.eventos.map((e) => e.data)} titulo="Agenda e presença em eventos" legenda="eventos" />

      <Desempenho
        indicadores={[
          { rotulo: "Eventos em 12 meses", valor: String(data.eventos.length), icone: "agenda" },
          { rotulo: "Sessões em plenário", valor: String(sessoes), icone: "votos" },
          { rotulo: "Proposições (últimas 100)", valor: String(data.proposicoes.length), icone: "propostas" },
          { rotulo: "Tipos de proposição", valor: String(new Set(data.proposicoes.map((x) => x.tipo)).size), icone: "tendencia" },
        ]}
        barras={{ titulo: "Proposições por ano", dados: anos }}
        pizza={{ titulo: "Eventos por tipo", dados: contar(data.eventos.map((e) => e.tipo)) }}
      />

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
