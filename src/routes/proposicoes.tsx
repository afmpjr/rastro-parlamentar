import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { buscarProposicoes, temasCamara, type Busca } from "@/lib/proposicoes.functions";
import { Fontes } from "@/components/Fontes";

const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const busca = (b: Busca) => queryOptions({ queryKey: ["busca-prop", b], queryFn: () => buscarProposicoes({ data: b }), staleTime: 600_000 });

export const Route = createFileRoute("/proposicoes")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    casa: str(s["casa"]) === "senado" ? "senado" : "camara", q: str(s["q"]), tipo: str(s["tipo"]), numero: str(s["numero"]), ano: str(s["ano"]),
    autor: str(s["autor"]), tema: str(s["tema"]), tramitando: str(s["tramitando"]), pagina: Math.max(1, Number(s["pagina"]) || 1),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(busca(deps)),
  head: () => ({ meta: [
    { title: "Projetos de lei e proposições — Plenário Aberto" },
    { name: "description", content: "Busque projetos de lei, PECs e outras proposições da Câmara e do Senado por palavra, número, autor, tema ou situação." },
    { property: "og:title", content: "Busca de projetos de lei — Plenário Aberto" },
    { property: "og:description", content: "Autores, relatores, tramitação, votações e textos oficiais de cada proposição." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  errorComponent: ({ error }) => <p role="alert">Não foi possível buscar agora: {(error as Error).message}</p>,
  component: Pagina,
});

const campo = "border border-input bg-card px-3 py-2";
const TIPOS = ["PL", "PEC", "PLP", "MPV", "PDL", "PDC", "PRC", "PLV", "REQ"];

function Pagina() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/proposicoes" });
  const [f, setF] = useState(s);
  const { data } = useSuspenseQuery({ ...busca(s), initialData: Route.useLoaderData() });
  const temas = useQuery({ queryKey: ["temas"], queryFn: () => temasCamara(), staleTime: 86400_000, enabled: f.casa === "camara" });
  const set = (k: keyof Busca) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const ir = (p: Partial<Busca>) => nav({ search: { ...f, ...p } });
  return (
    <div>
      <h1 className="text-4xl font-bold">Projetos de lei e proposições</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Procure por palavra da ementa, por tipo, número e ano (ex.: PL 2338/2023), pelo nome de quem apresentou, por tema ou situação.</p>
      <form className="mt-6 grid gap-3 md:grid-cols-6" onSubmit={(e) => { e.preventDefault(); ir({ pagina: 1 }); }}>
        <select className={campo} value={f.casa} onChange={(e) => setF({ ...f, casa: e.target.value, tema: "", tramitando: "" })} aria-label="Casa">
          <option value="camara">Câmara</option><option value="senado">Senado</option>
        </select>
        <input className={`${campo} md:col-span-5`} placeholder="Palavra-chave (ex.: inteligência artificial)" value={f.q} onChange={set("q")} aria-label="Palavra-chave" />
        <select className={campo} value={f.tipo} onChange={set("tipo")} aria-label="Tipo"><option value="">Todos os tipos</option>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select>
        <input className={campo} placeholder="Número" inputMode="numeric" value={f.numero} onChange={set("numero")} aria-label="Número" />
        <input className={campo} placeholder="Ano" inputMode="numeric" value={f.ano} onChange={set("ano")} aria-label="Ano" />
        <input className={`${campo} md:col-span-2`} placeholder="Autor (nome)" value={f.autor} onChange={set("autor")} aria-label="Autor" />
        {f.casa === "camara" ? (
          <select className={campo} value={f.tema} onChange={set("tema")} aria-label="Tema"><option value="">Todos os temas</option>{(temas.data ?? []).map((t) => <option key={t.cod} value={t.cod}>{t.nome}</option>)}</select>
        ) : (
          <select className={campo} value={f.tramitando} onChange={set("tramitando")} aria-label="Situação"><option value="">Qualquer situação</option><option value="S">Em tramitação</option><option value="N">Encerradas</option></select>
        )}
        <button className="flex items-center justify-center gap-2 bg-primary px-4 py-2 font-medium text-primary-foreground md:col-span-6 md:justify-self-start"><Search className="h-4 w-4" aria-hidden />Buscar</button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        {data.erro || (data.total != null ? `${data.total} resultado(s) no Senado.` : `${data.itens.length} resultado(s) nesta página da Câmara.`)}
        {!s.ano && !s.numero && s.casa === "senado" && !s.q && !s.autor && !s.tipo ? " Sem filtros, mostramos as do ano atual." : ""}
      </p>
      <ul className="mt-3 divide-y divide-border border-y border-border">
        {data.itens.map((p) => (
          <li key={p.id}>
            <Link to="/proposicao/$casa/$id" params={{ casa: p.casa, id: p.id }} className="block py-4 hover:bg-muted/50">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <FileText className="h-4 w-4 self-center text-primary" aria-hidden />
                <span className="font-bold">{p.identificacao}</span>
                <span className="text-sm text-muted-foreground">{p.data.split("-").reverse().join("/")}</span>
                {p.situacao && <span className="text-xs uppercase tracking-wide text-muted-foreground">{p.situacao}</span>}
              </div>
              <p className="mt-1 line-clamp-2">{p.ementa}</p>
              {p.autoria && <p className="mt-1 text-sm text-muted-foreground">{p.autoria}</p>}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-3">
        <button disabled={s.pagina <= 1} onClick={() => nav({ search: { ...s, pagina: s.pagina - 1 } })} className="flex items-center gap-1 border border-input px-3 py-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden />Anterior</button>
        <span className="text-sm">Página {s.pagina}</span>
        <button disabled={!data.temMais} onClick={() => nav({ search: { ...s, pagina: s.pagina + 1 } })} className="flex items-center gap-1 border border-input px-3 py-1 disabled:opacity-40">Próxima<ChevronRight className="h-4 w-4" aria-hidden /></button>
      </div>
      <Fontes fontes={data.fontes} />
    </div>
  );
}
