import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { detalheDeputado } from "@/lib/fontes.functions";
import { Fontes, Selo } from "@/components/Fontes";

const q = (id: string) => queryOptions({ queryKey: ["dep", id], queryFn: () => detalheDeputado({ data: { id } }), staleTime: 3600_000 });
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const Route = createFileRoute("/deputado/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(q(params.id)),
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.perfil.nome} (${loaderData.perfil.partido}-${loaderData.perfil.uf}) — Plenário Aberto` : "Deputado — Plenário Aberto";
    const d = "Perfil, despesas da cota parlamentar e proposições, com fonte oficial.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }] };
  },
  component: Dep,
});

function Dep() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(q(id));
  const p = data.perfil;
  const porTipo = Object.entries(data.despesas.reduce<Record<string, number>>((a, d) => ((a[d.tipo] = (a[d.tipo] ?? 0) + d.valor), a), {})).sort((a, b) => b[1] - a[1]);
  const porForn = Object.entries(data.despesas.reduce<Record<string, number>>((a, d) => ((a[`${d.fornecedor} (${d.cnpjCpf})`] = (a[`${d.fornecedor} (${d.cnpjCpf})`] ?? 0) + d.valor), a), {})).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const total = data.despesas.reduce((s, d) => s + d.valor, 0);
  return (
    <article>
      <div className="flex flex-wrap gap-6">
        <img src={p.foto} alt={p.nome} className="h-40 w-32 border border-foreground object-cover" />
        <div>
          <p className="label-caps">Deputado(a) federal · Legislatura {p.legislatura} <Selo tipo="oficial" /></p>
          <h1 className="mt-1 text-5xl font-bold">{p.nome}</h1>
          <p className="mt-2 text-lg">{p.partido} · {p.uf} · {p.situacao}</p>
          <p className="text-sm text-muted-foreground">{p.nomeCivil} · nasc. {p.nascimento} em {p.municipioNascimento} · {p.escolaridade}</p>
          {p.email && <p className="text-sm">{p.email}</p>}
        </div>
      </div>

      <section className="mt-12">
        <h2 className="border-b-2 border-foreground pb-1 text-2xl font-bold">Cota parlamentar (CEAP)</h2>
        {data.despesas.length === 0 ? (
          <p className="mt-4 text-muted-foreground">A API oficial da Câmara não retornou despesas para este parlamentar no momento da coleta. Os dados completos estão no <a className="link-evidence" href={data.despesasArquivo}>arquivo anual oficial</a>. (Lacuna registrada.)</p>
        ) : (
          <div className="mt-4 grid gap-8 md:grid-cols-2">
            <div>
              <p className="label-caps">Últimas {data.despesas.length} notas · total {brl(total)} <Selo tipo="calculo" /></p>
              <ul className="mt-3 space-y-2">{porTipo.map(([t, v]) => (
                <li key={t}><div className="flex justify-between text-sm"><span>{t}</span><span className="font-medium">{brl(v)}</span></div>
                <div className="h-2 bg-secondary"><div className="h-2 bg-primary" style={{ width: `${(v / (porTipo[0]?.[1] ?? 1)) * 100}%` }} /></div></li>))}
              </ul>
            </div>
            <div>
              <p className="label-caps">Principais fornecedores <Selo tipo="calculo" /></p>
              <ol className="mt-3 space-y-1 text-sm">{porForn.map(([f, v]) => <li key={f} className="flex justify-between gap-4 border-b border-border py-1"><span>{f}</span><span className="font-medium">{brl(v)}</span></li>)}</ol>
              <p className="mt-2 text-xs text-muted-foreground">Fornecedor recorrente não indica irregularidade.</p>
            </div>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="border-b-2 border-foreground pb-1 text-2xl font-bold">Proposições de autoria recentes</h2>
        <ul className="mt-2 divide-y divide-border">{data.proposicoes.map((x) => (
          <li key={x.id} className="py-3"><a className="font-semibold link-evidence" href={`https://www.camara.leg.br/propostas-legislativas/${x.id}`} target="_blank" rel="noreferrer">{x.sigla}</a>
          <span className="ml-2 text-sm text-muted-foreground">{x.data?.slice(0, 10)}</span><p className="text-sm">{x.ementa}</p></li>))}
          {data.proposicoes.length === 0 && <li className="py-3 text-muted-foreground">Nenhuma proposição retornada.</li>}
        </ul>
      </section>
      <Fontes fontes={data.fontes} />
    </article>
  );
}
