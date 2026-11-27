import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Pin, PinOff } from "lucide-react";
import { buscarEmendas, type FiltroEmendas } from "@/lib/emendas.functions";
import { Fontes, Selo } from "@/components/Fontes";
import { Escolha } from "@/components/Escolha";
import { brl, NOMES_UF } from "@/lib/ufs";
import { Button } from "@/components/ui/button";
import { BarraPagamento, ResumoDinheiro, GuiaFiscalizacao } from "@/components/GuiaFiscalizacao";
import { FiltrosAtivos } from "@/components/FiltrosAtivos";
import { AutorEmendas } from "@/components/AutorEmendas";

const q = (f: FiltroEmendas) => queryOptions({ queryKey: ["emendas", f], queryFn: () => buscarEmendas({ data: f }), staleTime: 3600_000 });

export const Route = createFileRoute("/emendas")({
  validateSearch: (s: Record<string, unknown>): FiltroEmendas => ({ ano: Number(s["ano"]) || 0, uf: String(s["uf"] ?? ""), municipio: String(s["municipio"] ?? ""), autor: String(s["autor"] ?? "") }),
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
  pendingComponent: () => <p className="py-10 text-muted-foreground">Carregando as emendas…</p>,
  errorComponent: ({ error }) => <p role="alert" className="py-10 text-destructive">Não foi possível ler o Portal da Transparência: {(error as Error).message}</p>,
  notFoundComponent: () => <p className="py-10">Nada encontrado.</p>,
});

type Grupo = { nome: string; empenhado: number; pago: number; qtd: number };
function Tabela({ titulo, itens, aoClicar, fixavel }: { titulo: string; itens: Grupo[]; aoClicar?: (n: string) => void; fixavel?: string }) {
  const [todos, setTodos] = useState(false);
  const [fixos, setFixos] = useState<string[]>([]);
  useEffect(() => { if (fixavel) try { setFixos(JSON.parse(localStorage.getItem(fixavel) ?? "[]")); } catch { /* ignora */ } }, [fixavel]);
  const alternar = (n: string) => setFixos((f) => { const nf = f.includes(n) ? f.filter((x) => x !== n) : [...f, n]; if (fixavel) localStorage.setItem(fixavel, JSON.stringify(nf)); return nf; });
  const max = Math.max(1, ...itens.map((i) => i.empenhado));
  const ordenados = [...itens.filter((i) => fixos.includes(i.nome)), ...itens.filter((i) => !fixos.includes(i.nome))];
  const limite = Math.max(8, itens.filter((i) => fixos.includes(i.nome)).length);
  const visiveis = todos ? ordenados : ordenados.slice(0, limite);
  return (
    <section className="border-t border-border py-4">
      <h2 className="font-display text-xl font-bold">{titulo}</h2>
      <ul className="mt-3 space-y-3">
        {visiveis.map((i) => {
          const fixo = fixos.includes(i.nome);
          return (
          <li key={i.nome} className="text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-1.5">
                {fixavel && <Button variant="ghost" size="icon" type="button" onClick={() => alternar(i.nome)} aria-pressed={fixo} aria-label={fixo ? `Desafixar ${i.nome}` : `Fixar ${i.nome} no topo`} title={fixo ? "Desafixar" : "Fixar no topo"} className={fixo ? "shrink-0 text-primary" : "shrink-0 text-muted-foreground hover:text-foreground"}>{fixo ? <Pin className="h-3.5 w-3.5 fill-current" /> : <PinOff className="h-3.5 w-3.5" />}</Button>}
                {aoClicar ? <Button variant="link" className="h-auto whitespace-normal break-words p-0 text-left" onClick={() => aoClicar(i.nome)}>{i.nome}</Button> : <span className="break-words">{i.nome}</span>}
              </span>
              <span className="shrink-0 font-medium">{brl(i.empenhado)}</span>
            </div>
            <div className="mt-1 h-1.5 bg-secondary"><div className="h-full bg-primary" style={{ width: `${(i.empenhado / max) * 100}%` }} /></div>
            <p className="mt-0.5 text-xs text-muted-foreground">{i.qtd} emendas · reservado {brl(i.empenhado)} · pago {brl(i.pago)}</p>
            <BarraPagamento empenhado={i.empenhado} pago={i.pago} />
          </li>
        ); })}
        {itens.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma emenda com esses filtros.</li>}
      </ul>
      {ordenados.length > limite && <Button variant="link" type="button" onClick={() => setTodos((t) => !t)} className="mt-3 px-0">{todos ? "Mostrar menos" : `Mostrar mais (${ordenados.length - limite})`}</Button>}
    </section>
  );
}

function Pagina() {
  const f = Route.useSearch();
  const nav = useNavigate({ from: "/emendas" });
  const { data } = useSuspenseQuery(q(f));
  const [mun, setMun] = useState(f.municipio), [aut, setAut] = useState(f.autor);
  const ir = (p: Partial<FiltroEmendas>) => nav({ search: (s) => ({ ...s, ...p }) });
  const chips = [
    ...(f.ano === -1 ? [{ rotulo: "Todos os anos", aoRemover: () => ir({ ano: 0 }) }] : f.ano ? [{ rotulo: `Ano: ${f.ano}`, aoRemover: () => ir({ ano: 0 }) }] : []),
    ...(f.uf ? [{ rotulo: NOMES_UF[f.uf] ?? f.uf, aoRemover: () => ir({ uf: "" }) }] : []),
    ...(f.municipio ? [{ rotulo: `Cidade: ${f.municipio}`, aoRemover: () => { setMun(""); ir({ municipio: "" }); } }] : []),
    ...(f.autor ? [{ rotulo: `Autor: ${f.autor}`, aoRemover: () => { setAut(""); ir({ autor: "" }); } }] : []),
  ];
  const limpar = () => { setMun(""); setAut(""); nav({ search: { ano: 0, uf: "", municipio: "", autor: "" } }); };
  const enviar = (e: FormEvent) => { e.preventDefault(); ir({ municipio: mun, autor: aut }); };
  return (
    <div>
      <p className="label-caps">Para onde foi o dinheiro</p>
      <h1 className="break-words font-display text-3xl font-bold sm:text-4xl">{f.municipio ? `Emendas para ${f.municipio}${f.uf ? ` (${f.uf})` : ""}` : "Emendas parlamentares"}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Deputados e senadores indicam parte do orçamento federal para estados e municípios. Busque sua cidade ou um parlamentar e veja quanto foi reservado (empenhado) e quanto já foi pago.</p>
      <form onSubmit={enviar} className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-[8rem_1fr_1fr_1fr_auto]">
        <Escolha rotulo="Ano" value={String(data.ano)} onChange={(v) => ir({ ano: Number(v) })} opcoes={[{ v: "-1", l: "Todos os anos" }, ...data.anos.map((a) => ({ v: String(a), l: String(a) }))]} />
        <Escolha className={f.uf ? "border-primary ring-1 ring-primary" : ""} rotulo="Estado" value={f.uf} onChange={(v) => ir({ uf: v })} opcoes={[{ v: "", l: "Todos os estados" }, ...data.ufs.map((u) => ({ v: u, l: `${NOMES_UF[u] ?? u} (${u})` }))]} />
        <input aria-label="Município" placeholder="Município" value={mun} onChange={(e) => setMun(e.target.value)} className={`border bg-card px-3 py-2 ${f.municipio ? "border-primary ring-1 ring-primary" : "border-input"}`} />
        <input aria-label="Parlamentar" placeholder="Parlamentar ou bancada" value={aut} onChange={(e) => setAut(e.target.value)} className={`border bg-card px-3 py-2 ${f.autor ? "border-primary ring-1 ring-primary" : "border-input"}`} />
        <Button type="submit" className="min-h-10">Buscar</Button>
      </form>
      <FiltrosAtivos chips={chips} aoLimpar={limpar} />
      <ResumoDinheiro empenhado={data.empenhado} pago={data.pago} qtd={data.qtd} />
      <AutorEmendas autor={data.autores.length === 1 ? data.autores[0]?.nome ?? f.autor : f.autor} uf={f.uf} />
      {data.qtd === 0 && f.municipio && (
        <div className="mt-4 border-l-4 border-primary bg-card p-5" role="status">
          <p className="text-lg font-semibold">Não encontramos registros para {f.municipio} {data.ano === -1 ? "no período disponível" : `no orçamento de ${data.ano}`} com estes filtros.</p>
          <p className="mt-1 text-muted-foreground">Isso não comprova ausência de repasses. Confira a autoria, o ano e a cobertura da base; recursos destinados ao estado podem beneficiar a cidade sem aparecer neste recorte.</p>
          {data.anosCidade.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="font-medium">Anos em que a cidade recebeu:</span>
              {data.anosCidade.map((a) => <button key={a.ano} type="button" onClick={() => ir({ ano: a.ano })} className="border border-primary px-3 py-1 text-sm font-medium text-primary hover:bg-secondary">{a.ano} · {brl(a.empenhado)}</button>)}
              <button type="button" onClick={() => ir({ ano: -1 })} className="bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">Ver todos os anos</button>
            </div>
          )}
        </div>
      )}
      <p className="mt-2 flex flex-wrap gap-2 text-xs"><Selo tipo="oficial" url={data.fontes[0]?.url} /><Selo tipo="calculo" explica="Somamos, por nós, os valores de cada emenda publicada pelo Portal da Transparência para o ano e filtros escolhidos. Empenhado é o valor reservado; pago é o que já saiu do caixa." /></p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Tabela titulo="Quem mais destinou" itens={data.autores} aoClicar={(n) => { setAut(n); ir({ autor: n }); }} />
        <Tabela titulo="Municípios que mais receberam" itens={data.municipios} aoClicar={(n) => { setMun(n); ir({ municipio: n }); }} />
        <Tabela titulo="Por área" itens={data.areas} fixavel="emendas-areas-fixas" />
        <Tabela titulo="Por tipo de emenda" itens={data.tipos} />
      </div>
      <GuiaFiscalizacao municipio={f.municipio} uf={f.uf} autor={f.autor} ano={data.ano} empenhado={data.empenhado} pago={data.pago} />
      <Fontes fontes={data.fontes} />
    </div>
  );
}
