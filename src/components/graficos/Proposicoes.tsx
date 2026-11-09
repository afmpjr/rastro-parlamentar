import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { situacaoProposicoes } from "@/lib/fontes.functions";
import { Selo } from "@/components/Fontes";

type Prop = { id: number; sigla: string; tipo: string; ementa: string; data: string };
const aprovada = (s: string) => /aprovad|transformad[oa] em (norma|lei)|sancionad|promulgad|deferid/i.test(s);
const arquivada = (s: string) => /arquivad|rejeitad|retirad|prejudicad|indeferid/i.test(s);

/** Lista detalhada das proposições, com tipo, situação e se foram aprovadas. */
export function DetalheProposicoes({ props, porTipo }: { props: Prop[]; porTipo?: boolean }) {
  const [tipo, setTipo] = useState(""); const [sit, setSit] = useState("");
  const q = useQuery({ queryKey: ["sit", props.map((p) => p.id).join(",")], queryFn: () => situacaoProposicoes({ data: { ids: props.map((p) => p.id) } }), staleTime: 3600_000 });
  const s = q.data?.situacoes ?? {};
  const situ = (p: Prop) => s[p.id]?.situacao || s[p.id]?.tramitacao || "";
  const tipos = useMemo(() => {
    const m = new Map<string, { n: number; desc: string; aprov: number }>();
    for (const p of props) { const e = m.get(p.tipo) ?? { n: 0, desc: "", aprov: 0 }; e.n++; e.desc = s[p.id]?.descricaoTipo ?? e.desc; if (aprovada(situ(p))) e.aprov++; m.set(p.tipo, e); }
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
  }, [props, q.data]);
  const nAprov = props.filter((p) => aprovada(situ(p))).length, nArq = props.filter((p) => arquivada(situ(p))).length;
  const lista = props.filter((p) => (!tipo || p.tipo === tipo) && (!sit || (sit === "aprov" ? aprovada(situ(p)) : sit === "arq" ? arquivada(situ(p)) : !aprovada(situ(p)) && !arquivada(situ(p)))));
  const btn = (on: boolean) => `border px-2 py-1 text-xs ${on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`;
  return (
    <div className="mt-4 border border-foreground p-4">
      {q.isLoading ? <p className="text-sm text-muted-foreground">Consultando a situação de cada proposição na Câmara…</p> : (
        <p className="text-sm"><b>{nAprov}</b> aprovadas ou transformadas em norma · <b>{nArq}</b> arquivadas/rejeitadas/retiradas · <b>{props.length - nAprov - nArq}</b> em tramitação ou sem situação <Selo tipo="calculo" explica="Consultamos a situação de cada proposição na Câmara e separamos por palavra-chave do texto oficial: aprovadas ou transformadas em norma, arquivadas/rejeitadas/retiradas e as demais, que ficam em tramitação ou sem situação informada." /></p>
      )}
      {porTipo ? (
        <table className="mt-3 w-full text-sm"><thead><tr className="label-caps text-left"><th>Sigla</th><th>Tipo</th><th className="text-right">Qtd.</th><th className="text-right">Aprovadas</th></tr></thead>
          <tbody>{tipos.map(([t, e]) => (
            <tr key={t} className="cursor-pointer border-t border-border hover:bg-secondary" onClick={() => setTipo(tipo === t ? "" : t)}>
              <td className="py-1 font-bold">{t}</td><td>{e.desc || "—"}</td><td className="text-right">{e.n}</td><td className="text-right">{q.isLoading ? "…" : e.aprov}</td></tr>))}</tbody></table>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className={btn(!sit)} onClick={() => setSit("")}>Todas</button>
          <button className={btn(sit === "aprov")} onClick={() => setSit("aprov")}>Aprovadas</button>
          <button className={btn(sit === "tram")} onClick={() => setSit("tram")}>Em tramitação</button>
          <button className={btn(sit === "arq")} onClick={() => setSit("arq")}>Arquivadas/rejeitadas</button>
          <select className="border border-border bg-background px-2 py-1 text-xs" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos os tipos</option>{tipos.map(([t, e]) => <option key={t} value={t}>{t} ({e.n})</option>)}</select>
        </div>
      )}
      {(!porTipo || tipo) && (
        <ul className="mt-3 max-h-[32rem] divide-y divide-border overflow-y-auto">
          {lista.map((p) => (
            <li key={p.id} className="py-2 text-sm">
              <a className="link-evidence inline-flex items-center gap-1 font-semibold" href={`https://www.camara.leg.br/propostas-legislativas/${p.id}`} target="_blank" rel="noreferrer">{p.sigla}<ExternalLink className="h-3 w-3" aria-hidden /></a>
              <span className="ml-2 text-muted-foreground">{p.data?.slice(0, 10).split("-").reverse().join("/")}</span>
              {situ(p) && <span className={`ml-2 px-1 text-xs ${aprovada(situ(p)) ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{situ(p)}</span>}
              <p>{p.ementa}</p>
            </li>
          ))}
          {lista.length === 0 && <li className="py-2 text-sm text-muted-foreground">Nenhuma proposição com esses filtros.</li>}
        </ul>
      )}
    </div>
  );
}
