import { createFileRoute } from "@tanstack/react-router";
import { foto } from "@/lib/foto";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Landmark, Users, Vote, FileText } from "lucide-react";
import { detalheSenador } from "@/lib/fontes.functions";
import { Fontes, Selo } from "@/components/Fontes";
import { ExploradorDespesas } from "@/components/graficos/Despesas";
import { PainelVotos } from "@/components/graficos/Votos";
import { GradeAtividade } from "@/components/graficos/Atividade";
import { Desempenho, contar } from "@/components/graficos/Desempenho";
import { rotuloVoto } from "@/lib/votos-label";

const q = (id: string) => queryOptions({ queryKey: ["sen", id], queryFn: () => detalheSenador({ data: { id } }), staleTime: 3600_000 });

export const Route = createFileRoute("/senador/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(q(params.id)),
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.perfil.nome} (${loaderData.perfil.partido}-${loaderData.perfil.uf}) — Plenário Aberto` : "Senador — Plenário Aberto";
    const d = "Despesas por categoria e período, presença em votações, desempenho, comissões e matérias de senador(a), com fonte oficial.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" }] };
  },
  errorComponent: ({ error }) => <p role="alert" className="text-muted-foreground">Não foi possível carregar este perfil agora: {(error as Error).message}</p>,
  notFoundComponent: () => <p>Senador(a) não encontrado(a).</p>,
  component: Sen,
});

const h2 = "flex items-center gap-2 border-b-2 border-foreground pb-1 text-2xl font-bold";

function Sen() {
  const { id } = Route.useParams();
  const inicial = Route.useLoaderData();
  const { data } = useSuspenseQuery({ ...q(id), initialData: inicial });
  const p = data.perfil;
  const umAno = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
  const ult12 = data.votacoes.filter((v) => v.data >= umAno);
  const votou = (v: string) => /^(sim|não|nao|abstenção|abst|obstrução|p-nrv|votou)/i.test(v);
  const participacao = ult12.length ? Math.round((ult12.filter((v) => votou(v.voto)).length / ult12.length) * 100) : 0;
  const autoriasAno = contar(data.autorias.map((a) => String(a.data).slice(0, 4))).sort((a, b) => a.nome.localeCompare(b.nome)).slice(-8);
  return (
    <article>
      <div className="flex flex-wrap gap-6">
        <img src={foto(p.foto)} alt={p.nome} className="h-40 w-32 border border-foreground object-cover" />
        <div>
          <p className="label-caps">Senador(a) <Selo tipo="oficial" url={data.fontes[0]?.url} /></p>
          <h1 className="mt-1 text-5xl font-bold">{p.nome}</h1>
          <p className="mt-2 text-lg">{p.partido} · {p.uf}</p>
          <p className="text-sm text-muted-foreground">{p.nomeCivil}{p.nascimento && ` · nasc. ${p.nascimento}`}{p.municipioNascimento && ` em ${p.municipioNascimento}`}</p>
          {p.email && <p className="text-sm">{p.email}</p>}
          {p.pagina && <a className="link-evidence text-sm" href={p.pagina} target="_blank" rel="noreferrer">Página oficial</a>}
        </div>
      </div>

      <ExploradorDespesas despesas={data.despesas} titulo="Cota parlamentar (CEAPS)" />

      <GradeAtividade itens={data.votacoes.map((v) => ({ data: v.data, tipo: rotuloVoto(v.voto) || "Sem registro", titulo: v.materia, detalhe: [v.descricao, v.resultado].filter(Boolean).join(" — ") }))} titulo="Atividade em votações nominais" legenda="votações" />

      <Desempenho
        indicadores={[
          { rotulo: "Votações em 12 meses", valor: String(ult12.length), icone: "votos" },
          { rotulo: "Votou (sim/não/abst.)", valor: `${participacao}%`, icone: "agenda" },
          { rotulo: "Matérias de autoria", valor: String(data.autorias.length), icone: "propostas" },
          { rotulo: "Comissões ativas", valor: String(data.comissoes.length), icone: "tendencia" },
        ]}
        barras={{ titulo: "Matérias apresentadas por ano", dados: autoriasAno }}
        pizza={{ titulo: "Votos registrados (todos)", dados: contar(data.votacoes.map((v) => rotuloVoto(v.voto) || "Sem registro")) }}
        explicaBarras="Contamos as matérias de autoria do senador pelo ano de apresentação, a partir da lista oficial de matérias de autoria."
        explicaPizza="Contamos os votos registrados em plenário por tipo de voto e mostramos a fatia de cada tipo no total de votações."
      />

      <PainelVotos votos={data.votacoes.map((v) => ({ data: v.data, voto: rotuloVoto(v.voto), titulo: v.materia, descricao: [v.ementa, v.descricao].filter(Boolean).join(" — "), aprovada: /aprovad/i.test(v.resultado) ? true : /rejeitad/i.test(v.resultado) ? false : null }))} />

      <section className="mt-12">
        <h2 className={h2}><Landmark className="h-6 w-6" aria-hidden />Mandatos</h2>
        <ul className="mt-2 divide-y divide-border">{data.mandatos.map((m, i) => <li key={i} className="py-2 text-sm">{m.uf} · {m.participacao} · {m.inicio} a {m.fim}</li>)}
          {data.mandatos.length === 0 && <li className="py-2 text-muted-foreground">Fonte não retornou mandatos.</li>}</ul>
      </section>
      <section className="mt-12">
        <h2 className={h2}><Vote className="h-6 w-6" aria-hidden />Votações nominais recentes <Selo tipo="oficial" url={data.fontes[3]?.url} /></h2>
        <ul className="mt-2 divide-y divide-border">{data.votacoes.slice(0, 30).map((v, i) => (
          <li key={i} className="grid grid-cols-[6rem_1fr_6rem] gap-3 py-2 text-sm">
            <span className="text-muted-foreground">{v.data}</span>
            <span><b>{v.materia}</b> — {v.descricao || v.ementa}{v.resultado && <span className="text-muted-foreground"> · {v.resultado}</span>}</span>
            <span className="text-right font-bold">{rotuloVoto(v.voto) || "—"}</span>
          </li>))}
          {data.votacoes.length === 0 && <li className="py-2 text-muted-foreground">Fonte não retornou votações.</li>}</ul>
      </section>
      <section className="mt-12">
        <h2 className={h2}><Users className="h-6 w-6" aria-hidden />Comissões atuais <Selo tipo="oficial" url={data.fontes[2]?.url} /></h2>
        <ul className="mt-2 divide-y divide-border">{data.comissoes.map((c, i) => (
          <li key={i} className="py-2 text-sm"><b>{c.sigla}</b> {c.nome} <span className="text-muted-foreground">· {c.casa} · {c.participacao} desde {c.inicio}</span></li>))}
          {data.comissoes.length === 0 && <li className="py-2 text-muted-foreground">Nenhuma comissão ativa retornada.</li>}</ul>
      </section>
      <section className="mt-12">
        <h2 className={h2}><FileText className="h-6 w-6" aria-hidden />Matérias de autoria <Selo tipo="oficial" url={data.fontes[4]?.url} /></h2>
        <ul className="mt-2 divide-y divide-border">{data.autorias.slice(0, 20).map((a, i) => (
          <li key={i} className="py-2 text-sm"><b>{a.sigla}</b> <span className="text-muted-foreground">{a.data}</span><br />{a.ementa}</li>))}
          {data.autorias.length === 0 && <li className="py-2 text-muted-foreground">Fonte não retornou autorias.</li>}</ul>
      </section>
      <Fontes fontes={data.fontes} />
    </article>
  );
}
