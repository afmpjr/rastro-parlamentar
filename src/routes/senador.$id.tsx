import { createFileRoute } from "@tanstack/react-router";
import { foto } from "@/lib/foto";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { detalheSenador } from "@/lib/fontes.functions";
import { Fontes, Selo } from "@/components/Fontes";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const q = (id: string) => queryOptions({ queryKey: ["sen", id], queryFn: () => detalheSenador({ data: { id } }), staleTime: 3600_000 });

export const Route = createFileRoute("/senador/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(q(params.id)),
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.perfil.nome} (${loaderData.perfil.partido}-${loaderData.perfil.uf}) — Plenário Aberto` : "Senador — Plenário Aberto";
    const d = "Perfil, despesas, votações, comissões e matérias de senador(a), com fonte oficial do Senado Federal.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }] };
  },
  component: Sen,
});

function Sen() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(q(id));
  const p = data.perfil;
  const soma = (k: (d: (typeof data.despesas)[number]) => string) => Object.entries(data.despesas.reduce<Record<string, number>>((a, d) => ((a[k(d)] = (a[k(d)] ?? 0) + d.valor), a), {})).sort((a, b) => b[1] - a[1]);
  const porTipo = soma((d) => d.tipo);
  const porForn = soma((d) => `${d.fornecedor} (${d.cnpjCpf})`).slice(0, 10);
  const total = data.despesas.reduce((s, d) => s + d.valor, 0);
  return (
    <article>
      <div className="flex flex-wrap gap-6">
        <img src={foto(p.foto)} alt={p.nome} className="h-40 w-32 border border-foreground object-cover" />
        <div>
          <p className="label-caps">Senador(a) <Selo tipo="oficial" /></p>
          <h1 className="mt-1 text-5xl font-bold">{p.nome}</h1>
          <p className="mt-2 text-lg">{p.partido} · {p.uf}</p>
          <p className="text-sm text-muted-foreground">{p.nomeCivil}{p.nascimento && ` · nasc. ${p.nascimento}`}{p.municipioNascimento && ` em ${p.municipioNascimento}`}</p>
          {p.email && <p className="text-sm">{p.email}</p>}
          {p.pagina && <a className="link-evidence text-sm" href={p.pagina} target="_blank" rel="noreferrer">Página oficial</a>}
        </div>
      </div>
      <section className="mt-12">
        <h2 className="border-b-2 border-foreground pb-1 text-2xl font-bold">Mandatos</h2>
        <ul className="mt-2 divide-y divide-border">{data.mandatos.map((m, i) => <li key={i} className="py-2 text-sm">{m.uf} · {m.participacao} · {m.inicio} a {m.fim}</li>)}
          {data.mandatos.length === 0 && <li className="py-2 text-muted-foreground">Fonte não retornou mandatos.</li>}</ul>
      </section>
      <section className="mt-12">
        <h2 className="border-b-2 border-foreground pb-1 text-2xl font-bold">Cota parlamentar (CEAPS) · {data.anoDesp}</h2>
        {data.despesas.length === 0 ? <p className="mt-4 text-muted-foreground">A fonte oficial do Senado não retornou despesas deste(a) senador(a) em {data.anoDesp}.</p> : (
          <div className="mt-4 grid gap-8 md:grid-cols-2">
            <div>
              <p className="label-caps">{data.despesas.length} notas · total {brl(total)} <Selo tipo="calculo" /></p>
              <ul className="mt-3 space-y-2">{porTipo.map(([t, v]) => (
                <li key={t}><div className="flex justify-between gap-4 text-sm"><span>{t}</span><span className="font-medium">{brl(v)}</span></div>
                <div className="h-2 bg-secondary"><div className="h-2 bg-primary" style={{ width: `${(v / (porTipo[0]?.[1] ?? 1)) * 100}%` }} /></div></li>))}</ul>
            </div>
            <div>
              <p className="label-caps">Principais fornecedores <Selo tipo="calculo" /></p>
              <ol className="mt-3 space-y-1 text-sm">{porForn.map(([f, v]) => <li key={f} className="flex justify-between gap-4 border-b border-border py-1"><span>{f}</span><span className="font-medium">{brl(v)}</span></li>)}</ol>
              <p className="mt-2 text-xs text-muted-foreground">Fornecedor recorrente não indica irregularidade.</p>
            </div>
          </div>)}
      </section>
      <section className="mt-12">
        <h2 className="border-b-2 border-foreground pb-1 text-2xl font-bold">Votações nominais recentes <Selo tipo="oficial" /></h2>
        <p className="mt-1 text-xs text-muted-foreground">Últimas {data.votacoes.length} votações em plenário.</p>
        <ul className="mt-2 divide-y divide-border">{data.votacoes.map((v, i) => (
          <li key={i} className="grid grid-cols-[6rem_1fr_6rem] gap-3 py-2 text-sm">
            <span className="text-muted-foreground">{v.data}</span>
            <span><b>{v.materia}</b> — {v.descricao || v.ementa}{v.resultado && <span className="text-muted-foreground"> · {v.resultado}</span>}</span>
            <span className="text-right font-bold">{v.voto || "—"}</span>
          </li>))}
          {data.votacoes.length === 0 && <li className="py-2 text-muted-foreground">Fonte não retornou votações.</li>}</ul>
      </section>
      <section className="mt-12">
        <h2 className="border-b-2 border-foreground pb-1 text-2xl font-bold">Comissões atuais <Selo tipo="oficial" /></h2>
        <ul className="mt-2 divide-y divide-border">{data.comissoes.map((c, i) => (
          <li key={i} className="py-2 text-sm"><b>{c.sigla}</b> {c.nome} <span className="text-muted-foreground">· {c.casa} · {c.participacao} desde {c.inicio}</span></li>))}
          {data.comissoes.length === 0 && <li className="py-2 text-muted-foreground">Nenhuma comissão ativa retornada.</li>}</ul>
      </section>
      <section className="mt-12">
        <h2 className="border-b-2 border-foreground pb-1 text-2xl font-bold">Matérias de autoria <Selo tipo="oficial" /></h2>
        <ul className="mt-2 divide-y divide-border">{data.autorias.map((a, i) => (
          <li key={i} className="py-2 text-sm"><b>{a.sigla}</b> <span className="text-muted-foreground">{a.data}</span><br />{a.ementa}</li>))}
          {data.autorias.length === 0 && <li className="py-2 text-muted-foreground">Fonte não retornou autorias.</li>}</ul>
      </section>
      <Fontes fontes={data.fontes} />
    </article>
  );
}
