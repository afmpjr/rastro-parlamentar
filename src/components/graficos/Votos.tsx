import { useMemo, useState } from "react";
import { Vote, ExternalLink, Check, X as XIcon } from "lucide-react";
import { Selo } from "@/components/Fontes";
import { contar } from "./Desempenho";

export type VotoItem = { data: string; voto: string; titulo: string; descricao?: string; aprovada?: boolean | null; url?: string };

/** Como o parlamentar votou num período escolhido. */
export function PainelVotos({ votos, carregando, erro, extra }: { votos: VotoItem[]; carregando?: boolean; erro?: string | undefined; extra?: React.ReactNode }) {
  const datas = votos.map((v) => v.data).sort();
  const [de, setDe] = useState(""); const [ate, setAte] = useState(""); const [voto, setVoto] = useState(""); const [n, setN] = useState(30);
  const noPeriodo = useMemo(() => votos.filter((v) => (!de || v.data >= de) && (!ate || v.data <= ate)), [votos, de, ate]);
  const resumo = contar(noPeriodo.map((v) => v.voto || "Sem registro"));
  const lista = voto ? noPeriodo.filter((v) => (v.voto || "Sem registro") === voto) : noPeriodo;
  const inp = "border border-border bg-background px-2 py-1 text-sm";
  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 border-b-2 border-foreground pb-1 text-2xl font-bold"><Vote className="h-6 w-6" aria-hidden />Como votou no período</h2>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        {extra}
        <label className="text-xs">De<br /><input type="date" className={inp} value={de} min={datas[0]} max={datas.at(-1)} onChange={(e) => setDe(e.target.value)} /></label>
        <label className="text-xs">Até<br /><input type="date" className={inp} value={ate} min={datas[0]} max={datas.at(-1)} onChange={(e) => setAte(e.target.value)} /></label>
        {(de || ate || voto) && <button className="border border-border px-2 py-1 text-xs hover:border-foreground" onClick={() => { setDe(""); setAte(""); setVoto(""); }}>Limpar</button>}
      </div>
      {carregando ? <p className="mt-4 text-sm text-muted-foreground">Lendo o arquivo oficial de votações… isso pode levar alguns segundos.</p>
        : erro ? <p role="alert" className="mt-4 text-sm text-muted-foreground">{erro}</p> : (<>
        <p className="label-caps mt-4">{noPeriodo.length} votações nominais no período <Selo tipo="calculo" explica="Filtramos as votações nominais do período escolhido e contamos quantas vezes cada tipo de voto aparece. O percentual de cada botão é sobre as votações desse período." /></p>
        <div className="mt-2 flex flex-wrap gap-2">
          {resumo.map((r) => (
            <button key={r.nome} onClick={() => setVoto(voto === r.nome ? "" : r.nome)} className={`border px-3 py-2 text-left ${voto === r.nome ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}>
              <span className="block text-2xl font-bold">{r.n}</span><span className="text-xs">{r.nome} · {Math.round((r.n / noPeriodo.length) * 100)}%</span>
            </button>
          ))}
        </div>
        <ul className="mt-4 divide-y divide-border">
          {lista.slice(0, n).map((v, i) => (
            <li key={i} className="grid gap-1 py-3 text-sm md:grid-cols-[6rem_8rem_1fr]">
              <span className="text-muted-foreground">{v.data.split("-").reverse().join("/")}</span>
              <span className="font-bold">{v.voto || "Sem registro"}</span>
              <div>
                <p className="font-semibold">{v.url ? <a className="link-evidence inline-flex items-center gap-1" href={v.url} target="_blank" rel="noreferrer">{v.titulo}<ExternalLink className="h-3 w-3" aria-hidden /></a> : v.titulo}</p>
                {v.descricao && <p className="text-muted-foreground">{v.descricao}</p>}
                {v.aprovada != null && <p className="mt-1 inline-flex items-center gap-1 text-xs">{v.aprovada ? <Check className="h-3 w-3" aria-hidden /> : <XIcon className="h-3 w-3" aria-hidden />}{v.aprovada ? "Aprovada" : "Rejeitada"}</p>}
              </div>
            </li>
          ))}
          {lista.length === 0 && <li className="py-3 text-sm text-muted-foreground">Nenhuma votação no período.</li>}
        </ul>
        {lista.length > n && <button className="mt-2 border border-foreground px-3 py-1 text-sm" onClick={() => setN(n + 30)}>Mostrar mais ({lista.length - n} restantes)</button>}
      </>)}
    </section>
  );
}
