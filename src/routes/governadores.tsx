import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Landmark, RotateCcw } from "lucide-react";
import { listarGovernadores } from "@/lib/governadores.functions";
import { Fontes, Selo } from "@/components/Fontes";
import { NOMES_UF, brl } from "@/lib/ufs";

const q = queryOptions({ queryKey: ["governadores"], queryFn: () => listarGovernadores(), staleTime: 3600_000 });

export const Route = createFileRoute("/governadores")({
  head: () => ({ meta: [
    { title: "Governadores — Plenário Aberto" },
    { name: "description", content: "Os 27 governadores em exercício e os eleitos em 2026, com partido, vice e bens declarados à Justiça Eleitoral." },
    { property: "og:title", content: "Governadores — Plenário Aberto" },
    { property: "og:description", content: "Governadores eleitos, vices e patrimônio declarado ao TSE, por estado." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: Pagina,
  errorComponent: ({ error }) => <p role="alert" className="mx-auto max-w-6xl px-4 py-10 text-destructive">Não foi possível carregar os dados da Justiça Eleitoral: {error.message}</p>,
  pendingComponent: () => <p className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">Lendo os arquivos oficiais do TSE…</p>,
});

function Pagina() {
  const { data } = useSuspenseQuery(q);
  const [aba, setAba] = useState<"atuais" | "eleitos">("atuais");
  const lista = aba === "atuais" ? data.atuais : data.eleitos;
  return (
    <div>
      <p className="label-caps">Executivo estadual</p>
      <h1 className="font-display text-4xl font-bold">Governadores</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Quem foi eleito em cada estado, com vice, partido e os bens que declarou à Justiça Eleitoral ao se candidatar.
        A lista de "em exercício" mostra os eleitos em {data.anoMandato}; trocas no meio do mandato (renúncia, cassação) não aparecem nestes arquivos.
      </p>
      <div role="tablist" className="mt-6 inline-flex border border-foreground">
        {([["atuais", `Mandato atual (eleitos em ${data.anoMandato})`], ["eleitos", `Eleitos em ${data.anoEleitos} · posse em jan/${data.anoEleitos + 1}`]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)}
            className={`min-h-11 px-4 text-sm font-medium ${aba === k ? "bg-foreground text-background" : "hover:bg-muted"}`}>{l}</button>
        ))}
      </div>
      {lista.length === 0 ? <p className="mt-6 text-muted-foreground">O TSE ainda não publicou o resultado desta eleição.</p> : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((g) => (
            <li key={g.sq}>
              <Link to="/governador/$uf" params={{ uf: g.uf }} className="block h-full border border-border p-4 transition hover:border-foreground">
                <div className="flex items-start justify-between gap-2">
                  <span className="label-caps">{NOMES_UF[g.uf] ?? g.uf}</span>
                  {"reeleito" in g && g.reeleito && <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><RotateCcw className="h-3 w-3" aria-hidden />Reeleito</span>}
                </div>
                <p className="mt-1 font-display text-xl font-bold">{g.nomeUrna}</p>
                <p className="text-sm">{g.partido}{g.vice && <span className="text-muted-foreground"> · vice {g.vice.nome} ({g.vice.partido})</span>}</p>
                <p className="mt-3 flex items-center gap-1 text-sm"><Landmark className="h-4 w-4 text-muted-foreground" aria-hidden />Bens declarados: <strong>{brl(g.patrimonio)}</strong></p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 flex flex-wrap gap-2 text-xs"><Selo tipo="oficial" url={data.fontes[0]?.url} /><Selo tipo="calculo" explica="O total de bens é a soma, feita por nós, de cada bem que o candidato declarou ao TSE no registro da candidatura. Valores são os informados pelo próprio candidato, sem correção." /></p>
      <Fontes fontes={data.fontes} />
    </div>
  );
}
