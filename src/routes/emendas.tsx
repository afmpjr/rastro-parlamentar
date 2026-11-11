import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { buscarEmendas, type FiltroEmendas } from "@/lib/emendas.functions";
import { Fontes, Selo } from "@/components/Fontes";
import { Escolha } from "@/components/Escolha";
import { brl } from "@/lib/ufs";

const q = (f: FiltroEmendas) => queryOptions({ queryKey: ["emendas", f], queryFn: () => buscarEmendas({ data: f }), staleTime: 3600_000 });

export const Route = createFileRoute("/emendas")({
  validateSearch: (s: Record<string, unknown>): FiltroEmendas => ({ ano: Number(s.ano) || 0, uf: String(s.uf ?? ""), municipio: String(s.municipio ?? ""), autor: String(s.autor ?? "") }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(q(deps)),
  head: () => ({ meta: [
    { title: "Emendas parlamentares — Plenário Aberto" },
    { name: "description", content: "Para onde foi o dinheiro das emendas: busque por estado, município ou parlamentar e veja valores empenhados e pagos." },
    { property: "og:title", content: "Emendas parlamentares — Plenário Aberto" },
    { property: "og:description", content: "Quem mandou verba para sua cidade, quanto e para qual área, com dados do Portal da Transparência." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Pagina,
  pendingComponent: () => <p className="py-10 text-muted-foreground">Lendo o arquivo oficial do Portal da Transparência…</p>,
  errorComponent: ({ error }) => <p role="alert" className="py-10 text-destructive">Não foi possível ler o Portal da Transparência: {(error as Error).message}</p>,
  notFoundComponent: () => <p className="py-10">Nada encontrado.</p>,
});

type Grupo = { nome: string; empenhado: number; pago: number; qtd: number };
function Tabela({ titulo, itens, aoClicar }: { titulo: string; itens: Grupo[]; aoClicar?: (n: string) => void }) {
  const max = itens[0]?.empenhado || 1;
  return (
    <section className="border border-border p-4">
      <h2 className="font-display text-xl font-bold">{titulo}</h2>
      <ul className="mt-3 space-y-3">
        {itens.map((i) => (
          <li key={i.nome} className="text-sm">
            <div className="flex justify-between gap-3">
              {aoClicar ? <button className="truncate text-left text-primary hover:underline" onClick={() => aoClicar(i.nome)}>{i.nome}</button> : <span className="truncate">{i.nome}</span>}
              <span className="shrink-0 font-medium">{brl(i.empenhado)}</span>
            </div>
            <div className="mt-1 h-1.5 bg-secondary"><div className="h-full bg-primary" style={{ width: `${(i.empenhado / max) * 100}%` }} /></div>
            <p className="mt-0.5 text-xs text-muted-foreground">{i.qtd} emendas · pago {brl(i.pago)}</p>
          </li>
        ))}
        {itens.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma emenda com esses filtros.</li>}
      </ul>
    </section>
  );
}

function Pagina() {
  const f = Route.useSearch();
  const nav = useNavigate({ from: "/emendas" });
  const { data } = useSuspenseQuery(q(f));
  const [mun, setMun] = useState(f.municipio), [aut, setAut] = useState(f.autor);
  const ir = (p: Partial<FiltroEmendas>) => nav({ search: (s) => ({ ...s, ...p }) });
  const enviar = (e: FormEvent) => { e.preventDefault(); ir({ municipio: mun, autor: aut }); };
  return (
    <div>
      <p className="label-caps">Para onde foi o dinheiro</p>
      <h1 className="font-display text-4xl font-bold">Emendas parlamentares</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Deputados e senadores indicam parte do orçamento federal para estados e municípios. Busque sua cidade ou um parlamentar e veja quanto foi reservado (empenhado) e quanto já foi pago.</p>
      <form onSubmit={enviar} className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-[8rem_1fr_1fr_1fr_auto]">
        <Escolha rotulo="Ano" value={String(data.ano)} onChange={(v) => ir({ ano: Number(v) })} opcoes={data.anos.map((a) => ({ v: String(a), l: String(a) }))} />
        <Escolha rotulo="Estado" value={f.uf} onChange={(v) => ir({ uf: v })} opcoes={[{ v: "", l: "Todos os estados" }, ...data.ufs.map((u) => ({ v: u, l: u }))]} />
        <input aria-label="Município" placeholder="Município" value={mun} onChange={(e) => setMun(e.target.value)} className="border border-input bg-card px-3 py-2" />
        <input aria-label="Parlamentar" placeholder="Parlamentar ou bancada" value={aut} onChange={(e) => setAut(e.target.value)} className="border border-input bg-card px-3 py-2" />
        <button className="min-h-10 bg-foreground px-4 text-sm font-medium text-background">Buscar</button>
      </form>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[["Emendas", data.qtd.toLocaleString("pt-BR")], ["Empenhado", brl(data.empenhado)], ["Pago", brl(data.pago)]].map(([r, v]) => (
          <div key={r} className="border border-border p-4"><p className="text-sm text-muted-foreground">{r}</p><p className="font-display text-3xl font-bold">{v}</p></div>
        ))}
      </div>
      <p className="mt-2 flex flex-wrap gap-2 text-xs"><Selo tipo="oficial" url={data.fontes[0]?.url} /><Selo tipo="calculo" explica="Somamos, por nós, os valores de cada emenda publicada pelo Portal da Transparência para o ano e filtros escolhidos. Empenhado é o valor reservado; pago é o que já saiu do caixa." /></p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Tabela titulo="Quem mais destinou" itens={data.autores} aoClicar={(n) => { setAut(n); ir({ autor: n }); }} />
        <Tabela titulo="Municípios que mais receberam" itens={data.municipios} aoClicar={(n) => { setMun(n); ir({ municipio: n }); }} />
        <Tabela titulo="Por área" itens={data.areas} />
        <Tabela titulo="Por tipo de emenda" itens={data.tipos} />
      </div>
      <Fontes fontes={data.fontes} />
    </div>
  );
}
