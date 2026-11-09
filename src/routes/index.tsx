import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { parlamentaresQuery } from "@/lib/parlamentares-query";
import { Plenario } from "@/components/Plenario";
import { Fontes, Selo } from "@/components/Fontes";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Plenário Aberto — Monitor de parlamentares federais" },
    { name: "description", content: "Acompanhe deputados e senadores com dados oficiais da Câmara e do Senado, sempre com a fonte." },
    { property: "og:title", content: "Plenário Aberto — Monitor de parlamentares federais" },
    { property: "og:description", content: "Deputados e senadores com dados oficiais e evidência rastreável." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(parlamentaresQuery),
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery({ ...parlamentaresQuery, initialData: Route.useLoaderData() });
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const dep = data.lista.filter((p) => p.casa === "camara").length;
  const sen = data.lista.length - dep;
  const partidos = new Set(data.lista.map((p) => p.partido)).size;
  return (
    <div>
      <p className="label-caps">Edição de {new Date().toLocaleDateString("pt-BR", { dateStyle: "long" })}</p>
      <h1 className="mt-3 max-w-3xl text-5xl font-bold leading-tight md:text-6xl">Quem representa você no Congresso — e o que diz o registro oficial.</h1>
      <form className="mt-8 flex max-w-2xl border-2 border-foreground" onSubmit={(e) => { e.preventDefault(); nav({ to: "/parlamentares", search: { q } }); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, partido ou UF" className="flex-1 bg-card px-4 py-3 outline-none" aria-label="Buscar parlamentar" />
        <button className="bg-foreground px-6 font-semibold text-background">Buscar</button>
      </form>
      <section className="mt-12 grid gap-0 border-y border-foreground md:grid-cols-3">
        {[["Deputados em exercício", dep], ["Senadores em exercício", sen], ["Partidos representados", partidos]].map(([l, v]) => (
          <div key={l as string} className="border-foreground py-6 md:border-r md:px-6 md:last:border-r-0">
            <div className="font-display text-5xl font-bold">{v}</div>
            <div className="mt-1 flex items-center gap-2 text-sm">{l} <Selo tipo={l === "Partidos representados" ? "calculo" : "oficial"} url={l === "Deputados em exercício" ? data.fontes[0]?.url : data.fontes[1]?.url} explica="Contamos quantos partidos diferentes aparecem entre todos os parlamentares em exercício. A fonte publica a lista com o partido de cada um; a contagem de partidos é feita por nós." /></div>
          </div>
        ))}
      </section>
      <Plenario lista={data.lista} fontes={data.fontes} />
      {data.erros.length > 0 && <p className="mt-4 text-destructive">Aviso: {data.erros.join(", ")}.</p>}
      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <div><h2 className="text-2xl font-bold">Evidência antes de inferência</h2><p className="mt-2 text-muted-foreground">Toda informação mostra de onde veio e quando foi coletada. Um gasto alto ou um fornecedor recorrente não significa irregularidade.</p></div>
        <div><h2 className="text-2xl font-bold">Mesmos critérios para todos</h2><p className="mt-2 text-muted-foreground">Nenhum partido, governo ou financiador interfere na seleção. <Link to="/metodologia" className="link-evidence">Leia a metodologia</Link>.</p></div>
      </section>
      <Fontes fontes={data.fontes} />
    </div>
  );
}
