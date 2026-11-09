import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { detalheSenador } from "@/lib/fontes.functions";
import { Fontes, Selo } from "@/components/Fontes";

const q = (id: string) => queryOptions({ queryKey: ["sen", id], queryFn: () => detalheSenador({ data: { id } }), staleTime: 3600_000 });

export const Route = createFileRoute("/senador/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(q(params.id)),
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.perfil.nome} (${loaderData.perfil.partido}-${loaderData.perfil.uf}) — Plenário Aberto` : "Senador — Plenário Aberto";
    const d = "Perfil e mandatos de senador(a), com fonte oficial do Senado Federal.";
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
        <p className="mt-6 text-sm text-muted-foreground">Despesas (CEAPS) e votações do Senado ainda não integradas — lacuna registrada na metodologia.</p>
      </section>
      <Fontes fontes={data.fontes} />
    </article>
  );
}
