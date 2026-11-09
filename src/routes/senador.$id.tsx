import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { detalheSenador } from "@/lib/fontes.functions";
import { Fontes, Selo } from "@/components/Fontes";

const q = (id: string) => queryOptions({ queryKey: ["sen", id], queryFn: () => detalheSenador({ data: { id } }), staleTime: 3600_000 });

export const Route = createFileRoute("/senador/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(q(params.id)),
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.perfil.nome} (${loaderData.perfil.partido}-${loaderData.perfil.uf}) — Plenário Aberto` : "Senador — Plenário Aberto";
    const d = "Perfil, votações, comissões e matérias de senador(a), com fonte oficial do Senado Federal.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }] };
  },
  component: Sen,
});

function Sen() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(q(id));
  const p = data.perfil;
  return (
    <article>
      <div className="flex flex-wrap gap-6">
        <img src={p.foto} alt={p.nome} className="h-40 w-32 border border-foreground object-cover" />
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
        <p className="mt-6 text-sm text-muted-foreground">Despesas (CEAPS) do Senado ainda não integradas — lacuna registrada na metodologia.</p>
      </section>
      <Fontes fontes={data.fontes} />
    </article>
  );
}
