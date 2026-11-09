import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { FileText, Landmark, Users } from "lucide-react";
import { detalheSenador } from "@/lib/fontes.functions";
import { Fontes } from "@/components/Fontes";
import { ExploradorDespesas } from "@/components/graficos/Despesas";
import { PainelVotos } from "@/components/graficos/Votos";
import { GradeAtividade } from "@/components/graficos/Atividade";
import { Desempenho, contar } from "@/components/graficos/Desempenho";
import { naturezaVotoSenado, rotuloVoto } from "@/lib/votos-label";
import {
  brlResumido,
  CabecalhoPerfil,
  CartaoPerfil,
  MetricasResumo,
  NavegacaoPerfil,
  ResumoDespesas,
  TituloSecao,
  VotacoesRecentes,
  type AbaPerfil,
} from "@/components/PerfilParlamentar";

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

function Sen() {
  const { id } = Route.useParams();
  const inicial = Route.useLoaderData();
  const { data } = useSuspenseQuery({ ...q(id), initialData: inicial });
  const [aba, setAba] = useState<AbaPerfil>("visao");
  const p = data.perfil;
  const anoAtual = new Date().getFullYear();
  const umAno = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
  const ult12 = data.votacoes.filter((v) => v.data >= umAno);
  const votou = (v: string) => /^(sim|não|nao|abstenção|abst|obstrução|p-nrv|votou)/i.test(v);
  const participacao = ult12.length ? Math.round((ult12.filter((v) => votou(v.voto)).length / ult12.length) * 100) : 0;
  const autoriasAno = contar(data.autorias.map((a) => String(a.data).slice(0, 4))).sort((a, b) => a.nome.localeCompare(b.nome)).slice(-8);
  const despesasAno = data.despesas.filter((d) => d.ano === anoAtual).reduce((s, d) => s + d.valor, 0);
  const mandato = data.mandatos[0];
  const periodoMandato = mandato?.inicio && mandato.fim ? `Mandato ${mandato.inicio.slice(0, 4)}–${mandato.fim.slice(0, 4)}` : null;
  const fontePerfil = data.fontes[0]?.url ?? `https://legis.senado.leg.br/dadosabertos/senador/${id}.json`;
  const paginaOficial = p.pagina || `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${id}`;
  const atividade = data.votacoes.map((v) => ({
    data: v.data,
    tipo: rotuloVoto(v.voto) || "Sem registro",
    titulo: v.materia,
    detalhe: [v.descricao, v.resultado].filter(Boolean).join(" — "),
    natureza: naturezaVotoSenado(v.voto),
  }));
  const votos = data.votacoes.map((v) => ({
    data: v.data,
    voto: rotuloVoto(v.voto),
    titulo: v.materia,
    descricao: [v.ementa, v.descricao].filter(Boolean).join(" — "),
    aprovada: /aprovad/i.test(v.resultado) ? true : /rejeitad/i.test(v.resultado) ? false : null,
  }));

  return (
    <article>
      <CabecalhoPerfil
        id={id}
        casa="senado"
        nome={p.nome}
        partido={p.partido}
        uf={p.uf}
        fotoUrl={p.foto}
        funcao="Senador(a)"
        fonteUrl={fontePerfil}
        paginaOficial={paginaOficial}
        mandato={periodoMandato}
        detalhes={[p.nomeCivil, p.nascimento && `Nascimento: ${p.nascimento.split("-").reverse().join("/")}`, p.municipioNascimento && `Natural de ${p.municipioNascimento}`]}
        email={p.email}
      />

      <NavegacaoPerfil valor={aba} aoMudar={setAba} conteudos={{
        visao: (
          <>
            <MetricasResumo itens={[
              { rotulo: "Participação em votações", valor: `${participacao}%`, icone: "votos", tipo: "calculo", explica: "Percentual de votações dos últimos 12 meses com Sim, Não, Abstenção, Obstrução, P-NRV ou registro equivalente, sobre o total de votações nominais retornado pelo Senado." },
              { rotulo: "Votações em 12 meses", valor: String(ult12.length), icone: "agenda", tipo: "calculo", explica: "Contagem das votações nominais oficiais com data dentro dos últimos 12 meses." },
              { rotulo: "Matérias de autoria", valor: String(data.autorias.length), icone: "propostas", tipo: "oficial", fonte: data.fontes[4]?.url },
              { rotulo: `Despesas em ${anoAtual}`, valor: brlResumido(despesasAno), icone: "despesas", tipo: "calculo", explica: `Soma dos valores reembolsados pela CEAPS em ${anoAtual}, conforme os registros oficiais disponíveis.` },
            ]} />
            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
              <CartaoPerfil><GradeAtividade itens={atividade} titulo="Atividade parlamentar" legenda="registros" filtroNatureza embutido resumo periodoInicial={3} /></CartaoPerfil>
              <ResumoDespesas despesas={data.despesas} aoVerTodas={() => setAba("despesas")} />
            </div>
            <VotacoesRecentes votos={votos} aoVerTodas={() => setAba("votacoes")} />
          </>
        ),
        despesas: <ExploradorDespesas despesas={data.despesas} titulo="Cota parlamentar (CEAPS)" embutido />,
        atividade: (
          <>
            <GradeAtividade itens={atividade} titulo="Atividade em votações nominais" legenda="registros" filtroNatureza embutido />
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
          </>
        ),
        votacoes: <PainelVotos votos={votos} embutido />,
        proposicoes: (
          <section>
            <TituloSecao icone={FileText} titulo="Matérias de autoria" fonte={data.fontes[4]?.url} />
            <ul className="mt-4 overflow-hidden rounded-lg border bg-card shadow-sm">
              {data.autorias.slice(0, 30).map((a) => (
                <li key={a.codigo || `${a.sigla}-${a.data}`} className="border-b p-4 last:border-b-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <a className="link-evidence font-semibold" href={`https://www25.senado.leg.br/web/atividade/materias/-/materia/${a.codigo}`} target="_blank" rel="noreferrer">{a.sigla}</a>
                    <time className="text-xs text-muted-foreground">{String(a.data).slice(0, 10).split("-").reverse().join("/")}</time>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.ementa}</p>
                </li>
              ))}
              {data.autorias.length === 0 && <li className="p-4 text-sm text-muted-foreground">Fonte não retornou autorias.</li>}
            </ul>
            {data.autorias.length > 30 && <p className="mt-3 text-sm text-muted-foreground">Exibindo as 30 matérias mais recentes de {data.autorias.length} retornadas pela fonte.</p>}
          </section>
        ),
        comissoes: (
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <TituloSecao icone={Users} titulo="Comissões atuais" fonte={data.fontes[2]?.url} />
              <ul className="mt-4 divide-y divide-border">
                {data.comissoes.map((c, i) => <li key={`${c.sigla}-${i}`} className="py-3 text-sm"><b>{c.sigla}</b> {c.nome}<p className="mt-1 text-muted-foreground">{c.casa} · {c.participacao} desde {c.inicio.split("-").reverse().join("/")}</p></li>)}
                {data.comissoes.length === 0 && <li className="py-3 text-sm text-muted-foreground">Nenhuma comissão ativa retornada.</li>}
              </ul>
            </section>
            <section>
              <TituloSecao icone={Landmark} titulo="Mandatos" fonte={data.fontes[1]?.url} />
              <ul className="mt-4 divide-y divide-border">
                {data.mandatos.map((m, i) => <li key={i} className="py-3 text-sm"><b>{m.uf}</b> · {m.participacao}<p className="mt-1 text-muted-foreground">{m.inicio.split("-").reverse().join("/")} a {m.fim.split("-").reverse().join("/")}</p></li>)}
                {data.mandatos.length === 0 && <li className="py-3 text-sm text-muted-foreground">Fonte não retornou mandatos.</li>}
              </ul>
            </section>
          </div>
        ),
      }} />
      <Fontes fontes={data.fontes} />
    </article>
  );
}
