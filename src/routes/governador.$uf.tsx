import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import { governadorDaUf, type Governador } from "@/lib/governadores.functions";
import { Fontes, Selo } from "@/components/Fontes";
import { NOMES_UF, brl } from "@/lib/ufs";

const q = (uf: string) => queryOptions({ queryKey: ["governador", uf], queryFn: () => governadorDaUf({ data: { uf } }), staleTime: 3600_000 });

export const Route = createFileRoute("/governador/$uf")({
  head: ({ params }) => {
    const n = NOMES_UF[params.uf.toUpperCase()] ?? params.uf;
    return { meta: [
      { title: `Governador de ${n} — Plenário Aberto` },
      { name: "description", content: `Governador de ${n}: partido, vice, coligação e bens declarados à Justiça Eleitoral.` },
      { property: "og:title", content: `Governador de ${n} — Plenário Aberto` },
      { property: "og:description", content: `Dados oficiais do TSE sobre o governador de ${n}.` },
      { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  loader: ({ context, params }) => context.queryClient.ensureQueryData(q(params.uf.toUpperCase())),
  component: Pagina,
  errorComponent: ({ error }) => <p role="alert" className="mx-auto max-w-6xl px-4 py-10 text-destructive">Não foi possível carregar os dados da Justiça Eleitoral: {error.message}</p>,
  pendingComponent: () => <p className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">Lendo os arquivos oficiais do TSE…</p>,
});

function Pagina() {
  const { uf } = Route.useParams();
  const { data } = useSuspenseQuery(q(uf.toUpperCase()));
  const nome = NOMES_UF[data.uf] ?? data.uf;
  if (!data.atual && !data.eleito) return <div><p>Estado não encontrado.</p></div>;
  return (
    <div>
      <Link to="/governadores" className="inline-flex min-h-10 items-center gap-1 text-sm hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden />Todos os governadores</Link>
      <p className="label-caps mt-4">Governo de <Link to="/estado/$uf" params={{ uf: data.uf }} className="hover:underline">{nome}</Link></p>
      {data.atual && <Ficha g={data.atual} titulo={`Mandato atual · eleito em ${data.anoMandato}`} />}
      {data.mesmaPessoa && data.atual && data.eleito && <Evolucao antes={data.atual} depois={data.eleito} />}
      {data.eleito && <Ficha g={data.eleito} titulo={`Eleito em ${data.anoEleitos} · posse em 1º de janeiro de ${data.anoEleitos + 1}${data.mesmaPessoa ? " (reeleição)" : ""}`} />}
      <Fontes fontes={data.fontes} />
    </div>
  );
}

function Ficha({ g, titulo }: { g: Omit<Governador, "_cpf">; titulo: string }) {
  const itens: [string, string][] = [
    ["Nome completo", g.nome], ["Partido", `${g.partido} — ${g.partidoNome}`], ["Vice", g.vice ? `${g.vice.nome} (${g.vice.partido})` : "—"],
    ["Coligação", g.coligacao && g.coligacao !== "PARTIDO ISOLADO" ? `${g.coligacao} (${g.composicao})` : "Partido isolado"],
    ["Decidido no", `${g.turno}º turno`], ["Nascimento", g.nascimento], ["Escolaridade", g.instrucao], ["Ocupação declarada", g.ocupacao], ["Gênero", g.genero],
  ];
  return (
    <section className="mt-6 border-t-2 border-foreground pt-4">
      <p className="label-caps">{titulo}</p>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">{g.nomeUrna}</h1>
      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
      </dl>
      <p className="mt-2"><Selo tipo="oficial" url={`https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_${g.ano}.zip`} /></p>
      <h2 className="mt-6 font-display text-xl font-bold">Bens declarados · {brl(g.patrimonio)}</h2>
      <p className="mt-1 flex flex-wrap gap-2 text-xs"><Selo tipo="oficial" url={`https://cdn.tse.jus.br/estatistica/sead/odsele/bem_candidato/bem_candidato_${g.ano}.zip`} /><Selo tipo="calculo" explica="Total somado por nós a partir de cada bem declarado pelo candidato ao TSE. São os valores informados pelo próprio candidato." /></p>
      {g.bens.length === 0 ? <p className="mt-2 text-muted-foreground">Nenhum bem declarado.</p> : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 pr-3">Tipo</th><th className="py-2 pr-3">Descrição</th><th className="py-2 text-right">Valor</th></tr></thead>
            <tbody>{g.bens.map((b, i) => <tr key={i} className="border-b border-border align-top"><td className="py-2 pr-3">{b.tipo}</td><td className="py-2 pr-3 text-muted-foreground">{b.descricao}</td><td className="py-2 text-right tabular-nums">{brl(b.valor)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Evolucao({ antes, depois }: { antes: Governador; depois: Governador }) {
  const d = depois.patrimonio - antes.patrimonio;
  const pct = antes.patrimonio ? (d / antes.patrimonio) * 100 : null;
  const Ic = d >= 0 ? TrendingUp : TrendingDown;
  return (
    <section className="mt-6 border border-foreground p-4">
      <p className="label-caps">Patrimônio declarado entre as duas eleições</p>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-lg"><Ic className="h-5 w-5" aria-hidden />{brl(antes.patrimonio)} em {antes.ano} → {brl(depois.patrimonio)} em {depois.ano}
        <strong>({d >= 0 ? "+" : ""}{brl(d)}{pct !== null ? `, ${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%` : ""})</strong></p>
      <p className="mt-1 text-xs"><Selo tipo="calculo" explica="Diferença entre a soma dos bens declarados nas duas candidaturas. A mesma pessoa é identificada pelo registro oficial do TSE. Valores declarados não são corrigidos pela inflação e podem seguir critérios diferentes (ex.: valor de compra)." /></p>
    </section>
  );
}
