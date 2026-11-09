import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, Flag } from "lucide-react";
import { parlamentaresQuery } from "@/lib/parlamentares-query";
import { detalhePartido } from "@/lib/fontes.functions";
import { Fontes, Selo } from "@/components/Fontes";
import { ListaParlamentares } from "@/components/ListaParlamentares";
import { foto } from "@/lib/foto";

export const Route = createFileRoute("/partido/$sigla")({
  loader: ({ context }) => context.queryClient.ensureQueryData(parlamentaresQuery),
  head: ({ params }) => ({ meta: [
    { title: `${params.sigla} — partido no Congresso | Plenário Aberto` },
    { name: "description", content: `Deputados e senadores do ${params.sigla} em exercício, com logo, líder e dados oficiais.` },
    { property: "og:title", content: `${params.sigla} no Congresso — Plenário Aberto` },
    { property: "og:description", content: `Bancada do ${params.sigla} na Câmara e no Senado, com fonte oficial.` },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Partido,
});

function Partido() {
  const { sigla } = Route.useParams();
  const { data } = useSuspenseQuery({ ...parlamentaresQuery, initialData: Route.useLoaderData() });
  const d = useQuery({ queryKey: ["partido", sigla], queryFn: () => detalhePartido({ data: { sigla } }), staleTime: 3600_000 });
  const membros = data.lista.filter((p) => p.partido.toUpperCase() === sigla.toUpperCase());
  const dep = membros.filter((p) => p.casa === "camara"), sen = membros.filter((p) => p.casa === "senado");
  const p = d.data?.partido;
  return (
    <div>
      <div className="flex items-center gap-4">
        {p?.logo ? <img src={foto(p.logo)} alt={`Logo do ${sigla}`} className="h-16 w-16 border border-border bg-card object-contain p-1" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <Flag className="h-12 w-12 text-primary" aria-hidden />}
        <div>
          <h1 className="text-4xl font-bold">{sigla}</h1>
          <p className="text-muted-foreground">{p?.nome ?? (d.isLoading ? "Carregando…" : "Nome não encontrado na Câmara")}</p>
        </div>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="border border-border bg-card p-3"><dt className="label-caps">Deputados</dt><dd className="text-3xl font-bold">{dep.length}</dd></div>
        <div className="border border-border bg-card p-3"><dt className="label-caps">Senadores</dt><dd className="text-3xl font-bold">{sen.length}</dd></div>
        <div className="border border-border bg-card p-3"><dt className="label-caps">Líder na Câmara</dt><dd className="font-semibold">{p?.lider ? <Link to="/deputado/$id" params={{ id: p.lider.id }} className="underline">{p.lider.nome} ({p.lider.uf})</Link> : "—"}</dd></div>
        <div className="border border-border bg-card p-3"><dt className="label-caps">Situação</dt><dd className="font-semibold">{p?.situacao || "—"}</dd>{p?.site && <a href={p.site} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm underline">Site<ExternalLink className="h-3 w-3" aria-hidden /></a>}</div>
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">Contagens: <Selo tipo="calculo" explica="Contamos os parlamentares em exercício hoje cuja sigla de partido, informada pela Câmara e pelo Senado, é esta." /> Logo, líder e situação: <Selo tipo="oficial" url={d.data?.fontes[0]?.url} /></p>
      {dep.length > 0 && <ListaParlamentares lista={dep} titulo="Deputados" />}
      {sen.length > 0 && <ListaParlamentares lista={sen} titulo="Senadores" />}
      {membros.length === 0 && <p className="mt-8">Nenhum parlamentar em exercício com esta sigla.</p>}
      <Fontes fontes={[...data.fontes, ...(d.data?.fontes ?? [])]} />
    </div>
  );
}
