import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { listarColetas } from "@/lib/dados.functions";

const consulta = queryOptions({ queryKey: ["coletas"], queryFn: () => listarColetas(), staleTime: 60_000 });
export const Route = createFileRoute("/coletas")({
  head: () => ({ meta: [
    { title: "Atualizações e fontes — Plenário Aberto" },
    { name: "description", content: "Histórico público das coletas de dados oficiais, com horário, quantidade de registros e resultado." },
    { property: "og:title", content: "Atualizações e fontes — Plenário Aberto" },
    { property: "og:description", content: "Acompanhe quando e como os dados oficiais foram coletados." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(consulta),
  component: Coletas,
});

function data(s: string | null) { return s ? new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Em andamento"; }
function Coletas() {
  const { data: d } = useSuspenseQuery({ ...consulta, initialData: Route.useLoaderData() });
  return <div>
    <h1 className="text-4xl font-bold">Atualizações e fontes</h1>
    <p className="mt-2 max-w-2xl text-muted-foreground">Cada coleta registra a origem, o horário e o resultado. Se uma atualização falha, a última coleta válida continua disponível.</p>
    {!d.coletas.length ? <p className="mt-8 border-2 border-foreground p-6">A primeira importação ainda não foi concluída.</p> : <ol className="mt-8 space-y-3">
      {d.coletas.map((c) => <li key={c.id} className="border border-border p-4">
        <div className="flex flex-wrap items-start gap-3">
          {c.status === "sucesso" ? <CheckCircle2 className="mt-1 h-5 w-5 text-primary" aria-hidden /> : c.status === "erro" ? <CircleAlert className="mt-1 h-5 w-5 text-destructive" aria-hidden /> : <LoaderCircle className="mt-1 h-5 w-5 animate-spin" aria-hidden />}
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">{c.fonte}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Início: {data(c.iniciado_em)} · Fim: {data(c.concluido_em)} · {c.registros.toLocaleString("pt-BR")} registros</p>
            {c.mensagem && <p className="mt-1 text-sm text-destructive">{c.mensagem}</p>}
            {c.hash_sha256 && <p className="mt-1 break-all font-mono text-xs text-muted-foreground">SHA-256: {c.hash_sha256}</p>}
          </div>
          <a href={c.url.split(" | ")[0]} target="_blank" rel="noreferrer" className="link-evidence text-sm">Abrir fonte oficial</a>
        </div>
      </li>)}
    </ol>}
  </div>;
}
