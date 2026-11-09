import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { parlamentaresQuery } from "@/lib/parlamentares-query";
import { Fontes, Selo } from "@/components/Fontes";
import { ListaParlamentares } from "@/components/ListaParlamentares";
import { PartidoLink } from "@/components/Rotulos";

const NOMES: Record<string, string> = { AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins" };

export const Route = createFileRoute("/estado/$uf")({
  loader: ({ context }) => context.queryClient.ensureQueryData(parlamentaresQuery),
  head: ({ params }) => { const n = NOMES[params.uf.toUpperCase()] ?? params.uf; return { meta: [
    { title: `Parlamentares de ${n} — Plenário Aberto` },
    { name: "description", content: `Deputados e senadores de ${n} em exercício, por partido, com dados oficiais.` },
    { property: "og:title", content: `Bancada de ${n} no Congresso — Plenário Aberto` },
    { property: "og:description", content: `Quem representa ${n} na Câmara e no Senado.` },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }; },
  component: Estado,
});

function Estado() {
  const uf = Route.useParams().uf.toUpperCase();
  const { data } = useSuspenseQuery({ ...parlamentaresQuery, initialData: Route.useLoaderData() });
  const ps = data.lista.filter((p) => p.uf === uf);
  const cont = new Map<string, number>(); for (const p of ps) cont.set(p.partido, (cont.get(p.partido) ?? 0) + 1);
  const partidos = [...cont.entries()].sort((a, b) => b[1] - a[1]);
  return (
    <div>
      <h1 className="flex items-center gap-3 text-4xl font-bold"><MapPin className="h-8 w-8 text-primary" aria-hidden />{NOMES[uf] ?? uf}</h1>
      <p className="mt-2 text-muted-foreground">{ps.filter((p) => p.casa === "camara").length} deputados e {ps.filter((p) => p.casa === "senado").length} senadores em exercício. <Selo tipo="calculo" explica="Contamos os parlamentares em exercício hoje cuja UF, informada pela Câmara e pelo Senado, é este estado." /></p>
      <h2 className="mt-6 label-caps">Partidos da bancada</h2>
      <ul className="mt-2 flex flex-wrap gap-2">{partidos.map(([s, n]) => <li key={s} className="flex items-center gap-2 border border-border bg-card px-2 py-1 text-sm"><PartidoLink sigla={s} /><span className="text-muted-foreground">{n}</span></li>)}</ul>
      <ListaParlamentares lista={ps.filter((p) => p.casa === "camara")} titulo="Deputados" />
      <ListaParlamentares lista={ps.filter((p) => p.casa === "senado")} titulo="Senadores" />
      <Fontes fontes={data.fontes} />
    </div>
  );
}
