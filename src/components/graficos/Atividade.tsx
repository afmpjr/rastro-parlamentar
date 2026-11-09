import { useMemo, useState } from "react";
import { Activity, X, ExternalLink, Filter } from "lucide-react";
import { Selo } from "@/components/Fontes";
import { useDica } from "@/components/Dica";

export type NaturezaAtividade = "comparecimento" | "expediente" | "nao-compareceu";
export type ItemAtividade = { data: string; tipo: string; titulo: string; detalhe?: string; url?: string; natureza?: NaturezaAtividade | undefined };
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const PERIODOS = [{ m: 1, r: "1 mês" }, { m: 3, r: "3 meses" }, { m: 6, r: "6 meses" }, { m: 12, r: "12 meses" }, { m: 1200, r: "Todo o histórico" }];
const iso = (d: Date) => d.toISOString().slice(0, 10);
const br = (k: string) => k.split("-").reverse().join("/");
const cor = ["var(--secondary)", "color-mix(in oklch, var(--primary) 30%, var(--secondary))", "color-mix(in oklch, var(--primary) 55%, var(--secondary))", "color-mix(in oklch, var(--primary) 80%, var(--secondary))", "var(--primary)"];
const corNaoCompareceu = ["var(--secondary)", "color-mix(in oklch, var(--destructive) 45%, var(--secondary))", "color-mix(in oklch, var(--destructive) 65%, var(--secondary))", "color-mix(in oklch, var(--destructive) 85%, var(--secondary))", "var(--destructive)"];

/** Grade estilo GitHub: uma célula por dia; clique mostra os registros do dia. */
export function GradeAtividade({ itens, titulo, legenda, filtroNatureza = false }: { itens: ItemAtividade[]; titulo: string; legenda: string; filtroNatureza?: boolean }) {
  const { ref, mostrar, esconder, dica } = useDica();
  const [meses, setMeses] = useState(12);
  const [tipos, setTipos] = useState<string[]>([]);
  const [natureza, setNatureza] = useState<"todos" | NaturezaAtividade>("todos");
  const [dia, setDia] = useState<string | null>(null);
  const daNatureza = useMemo(() => natureza === "todos" ? itens : itens.filter((i) => i.natureza === natureza), [itens, natureza]);
  const todosTipos = useMemo(() => {
    const m = new Map<string, number>(); for (const i of daNatureza) if (i.tipo) m.set(i.tipo, (m.get(i.tipo) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [daNatureza]);
  const filtrados = useMemo(() => (tipos.length ? daNatureza.filter((i) => tipos.includes(i.tipo)) : daNatureza), [daNatureza, tipos]);

  const { semanas, max, total, ativos, mesesPos, porDia } = useMemo(() => {
    const porDia = new Map<string, ItemAtividade[]>();
    for (const it of filtrados) { const k = it.data.slice(0, 10); (porDia.get(k) ?? porDia.set(k, []).get(k)!).push(it); }
    const hoje = new Date(); hoje.setUTCHours(0, 0, 0, 0);
    const ini = new Date(hoje); ini.setUTCMonth(ini.getUTCMonth() - meses); ini.setUTCDate(ini.getUTCDate() + 1);
    const nSem = Math.ceil((Math.round((+hoje - +ini) / 864e5) + 1 + ini.getUTCDay()) / 7);
    const d = new Date(ini); d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    const semanas: { k: string; n: number; fora: boolean }[][] = [];
    const mesesPos: { i: number; m: number }[] = [];
    let total = 0, ativos = 0, max = 0;
    for (let w = 0; w < nSem; w++) {
      const col: { k: string; n: number; fora: boolean }[] = [];
      for (let i = 0; i < 7; i++, d.setUTCDate(d.getUTCDate() + 1)) {
        const k = iso(d), n = porDia.get(k)?.length ?? 0, fora = d > hoje || d < ini;
        if (d.getUTCDate() === 1 || (w === 0 && i === 0)) mesesPos.push({ i: w, m: d.getUTCMonth() });
        if (!fora) { total += n; if (n) ativos++; max = Math.max(max, n); }
        col.push({ k, n, fora });
      }
      semanas.push(col);
    }
    return { semanas, max, total, ativos, mesesPos, porDia };
  }, [filtrados, meses]);
  const nivel = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / (max || 1)) * 4)));
  const doDia = dia ? porDia.get(dia) ?? [] : [];
  const btn = (on: boolean) => `border px-2 py-1 text-xs ${on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`;

  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 border-b-2 border-foreground pb-1 text-2xl font-bold"><Activity className="h-6 w-6" aria-hidden />{titulo}</h2>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="label-caps mr-1">Período</span>
        {PERIODOS.map((p) => <button key={p.m} className={btn(meses === p.m)} onClick={() => { setMeses(p.m); setDia(null); }}>{p.r}</button>)}
      </div>
      {filtroNatureza && <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="label-caps mr-1 inline-flex items-center gap-1"><Filter className="h-3 w-3" aria-hidden />Registro oficial</span>
        <button className={btn(natureza === "todos")} onClick={() => { setNatureza("todos"); setTipos([]); setDia(null); }}>Todos</button>
        <button className={btn(natureza === "comparecimento")} onClick={() => { setNatureza("comparecimento"); setTipos([]); setDia(null); }}>Comparecimento</button>
        <button className={btn(natureza === "expediente")} onClick={() => { setNatureza("expediente"); setTipos([]); setDia(null); }}>Expediente</button>
        <button className={btn(natureza === "nao-compareceu")} onClick={() => { setNatureza("nao-compareceu"); setTipos([]); setMeses(1200); setDia(null); }}>Não compareceu ({itens.filter((i) => i.natureza === "nao-compareceu").length})</button>
      </div>}
      {filtroNatureza && <p className="mt-2 max-w-3xl text-xs text-muted-foreground">Comparecimento: Sim, Não, Abstenção, voto secreto, presente sem registrar voto ou presidência da sessão. Expediente: atividade parlamentar ou missão oficial da Casa. “Não compareceu” reproduz o código NCom e aparece em vermelho. Licenças e demais códigos aparecem apenas em “Todos”. São registros do Senado, não uma inferência da plataforma.</p>}
      {todosTipos.length > 1 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="label-caps mr-1 inline-flex items-center gap-1"><Filter className="h-3 w-3" aria-hidden />Tipo</span>
          <button className={btn(tipos.length === 0)} onClick={() => setTipos([])}>Todos</button>
          {todosTipos.map(([t, n]) => <button key={t} className={btn(tipos.includes(t))} onClick={() => setTipos((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))}>{t} ({n})</button>)}
        </div>
      )}
      <p className="label-caps mt-4">{total} {legenda} em {ativos} dias no período <Selo tipo="calculo" explica="Contamos os registros oficiais do tipo escolhido no período selecionado e em quantos dias eles aparecem. A fonte publica cada registro; a soma é feita por nós." /></p>
      <div className="mt-3 flex gap-1 overflow-x-auto pb-2">
        <div className="flex w-8 shrink-0 flex-col pt-5 text-[10px] text-muted-foreground" style={{ gap: 3 }}>
          {DIAS.map((d, i) => <span key={i} className="flex flex-1 items-center">{i % 2 ? d : ""}</span>)}
        </div>
        <div ref={ref} className="relative min-w-0 flex-1" style={{ maxWidth: semanas.length * 44, minWidth: meses > 12 ? semanas.length * 14 : undefined }}>
          <div className="relative h-5 text-[10px] text-muted-foreground">
            {mesesPos.map(({ i, m }) => <span key={`${i}-${m}`} className="absolute" style={{ left: `${(i / semanas.length) * 100}%` }}>{MESES[m]}</span>)}
          </div>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${semanas.length}, minmax(0, 1fr))`, gap: 3 }}>
            {semanas.map((col, w) => (
              <div key={w} className="grid" style={{ gap: 3 }}>
                {col.map((c) => c.fora ? <div key={c.k} className="aspect-square max-h-14" /> : (
                  <button key={c.k} type="button" onClick={() => setDia(c.k === dia ? null : c.k)}
                    onMouseMove={(e) => mostrar(e, <><b>{br(c.k)}</b> · {c.n} {legenda}</>)} onMouseLeave={esconder} onFocus={(e) => mostrar(e, `${br(c.k)} · ${c.n} ${legenda}`)} onBlur={esconder} aria-label={`${br(c.k)}: ${c.n} ${legenda}`}
                    className={`aspect-square max-h-14 w-full ${c.k === dia ? "outline outline-2 outline-offset-1 outline-foreground" : "hover:outline hover:outline-1 hover:outline-foreground"}`}
                    style={{ background: (natureza === "nao-compareceu" ? corNaoCompareceu : cor)[nivel(c.n)] }} />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            {dica}
            menos {(natureza === "nao-compareceu" ? corNaoCompareceu : cor).map((c, i) => <span key={i} className="h-[11px] w-[11px]" style={{ background: c }} />)} mais
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Cada quadrado é um dia; clique para ver os {legenda}. Ausência de registro não significa falta injustificada.</p>
      {dia && (
        <div className="mt-4 border border-foreground p-4">
          <div className="flex items-center justify-between">
            <p className="font-bold">{br(dia)} · {doDia.length} {legenda}</p>
            <button onClick={() => setDia(null)} aria-label="Fechar"><X className="h-4 w-4" /></button>
          </div>
          <ul className="mt-2 divide-y divide-border">
            {doDia.map((it, i) => (
              <li key={i} className="py-2 text-sm">
                <span className="label-caps">{it.tipo}</span>
                <p className="font-semibold">{it.url ? <a className="link-evidence inline-flex items-center gap-1" href={it.url} target="_blank" rel="noreferrer">{it.titulo}<ExternalLink className="h-3 w-3" aria-hidden /></a> : it.titulo}</p>
                {it.detalhe && <p className="text-muted-foreground">{it.detalhe}</p>}
              </li>
            ))}
            {doDia.length === 0 && <li className="py-2 text-sm text-muted-foreground">Nenhum registro neste dia{tipos.length ? " para os tipos escolhidos" : ""}.</li>}
          </ul>
        </div>
      )}
    </section>
  );
}
