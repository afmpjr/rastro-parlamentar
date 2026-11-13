import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import type { ItemAtividade } from "./Atividade";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
type Rotulo = { texto: string; classe: string };

function rotuloDoDia(itens: ItemAtividade[]): Rotulo {
  if (itens.some((i) => i.natureza === "nao-compareceu")) return { texto: "Falta", classe: "border-destructive bg-destructive/10 text-destructive" };
  if (itens.some((i) => i.natureza === "comparecimento")) return { texto: "Presente", classe: "border-primary bg-primary/10 text-primary" };
  if (itens.some((i) => i.natureza === "expediente")) return { texto: "Missão", classe: "border-foreground bg-secondary text-foreground" };
  if (itens.some((i) => /sess/i.test(i.tipo))) return { texto: "Sessão", classe: "border-primary bg-primary/10 text-primary" };
  return { texto: itens.length > 1 ? `${itens.length} eventos` : "Evento", classe: "border-foreground bg-secondary text-foreground" };
}

/** Calendário mensal legível dos últimos 6 meses, com o que aconteceu escrito em cada dia. */
export function CartaoFrequencia({ itens, titulo, legenda }: { itens: ItemAtividade[]; titulo: string; legenda: string }) {
  const [volta, setVolta] = useState(0); // 0 = mês atual, 5 = cinco meses atrás
  const [dia, setDia] = useState<string | null>(null);
  const porDia = useMemo(() => {
    const m = new Map<string, ItemAtividade[]>();
    for (const it of itens) { const k = it.data.slice(0, 10); (m.get(k) ?? m.set(k, []).get(k)!).push(it); }
    return m;
  }, [itens]);
  const hoje = new Date();
  const ref = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - volta, 1));
  const ano = ref.getUTCFullYear(), mes = ref.getUTCMonth();
  const nDias = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  const celulas: (string | null)[] = [...Array(ref.getUTCDay()).fill(null)];
  for (let d = 1; d <= nDias; d++) celulas.push(`${ano}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  const resumo = { dias: 0, presente: 0, missao: 0, falta: 0 };
  for (const k of celulas) { const its = k && porDia.get(k); if (!its) continue; resumo.dias++; const r = rotuloDoDia(its).texto; if (r === "Falta") resumo.falta++; else if (r === "Missão") resumo.missao++; else if (r === "Presente" || r === "Sessão") resumo.presente++; }
  const doDia = dia ? porDia.get(dia) ?? [] : [];
  const seta = "inline-flex min-h-12 items-center gap-1 rounded-sm border-2 border-foreground px-3 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <section className="min-w-0 text-base">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold"><CalendarDays className="h-5 w-5 text-primary" aria-hidden />{titulo}</h2>
      <div className="mt-4 flex items-center justify-between gap-2">
        <button type="button" className={seta} disabled={volta >= 5} onClick={() => { setVolta((v) => v + 1); setDia(null); }} aria-label="Mês anterior"><ChevronLeft className="h-5 w-5" aria-hidden /><span className="hidden sm:inline">Anterior</span></button>
        <p className="text-center text-xl font-bold" aria-live="polite">{MESES[mes]} de {ano}</p>
        <button type="button" className={seta} disabled={volta <= 0} onClick={() => { setVolta((v) => v - 1); setDia(null); }} aria-label="Próximo mês"><span className="hidden sm:inline">Próximo</span><ChevronRight className="h-5 w-5" aria-hidden /></button>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["Dias com registro", resumo.dias], ["Presença / sessão", resumo.presente], ["Missão oficial", resumo.missao], ["Faltas registradas", resumo.falta]].map(([r, v]) => (
          <div key={r} className="rounded-sm border p-3"><dt className="text-sm text-muted-foreground">{r}</dt><dd className="text-3xl font-bold">{v}</dd></div>
        ))}
      </dl>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {DIAS.map((d) => <div key={d} className="py-1 text-sm font-semibold text-muted-foreground">{d}</div>)}
        {celulas.map((k, i) => {
          if (!k) return <div key={`v${i}`} />;
          const its = porDia.get(k); const r = its && rotuloDoDia(its); const n = Number(k.slice(8));
          return (
            <button key={k} type="button" disabled={!its} onClick={() => setDia(k === dia ? null : k)}
              aria-label={`Dia ${n}: ${r ? r.texto : "sem registro"}`}
              className={`flex min-h-16 flex-col items-center justify-start gap-1 rounded-sm border p-1 ${r ? r.classe : "border-border text-muted-foreground"} ${k === dia ? "outline outline-2 outline-offset-1 outline-foreground" : ""}`}>
              <span className="text-lg font-bold leading-none">{n}</span>
              {r && <span className="text-[0.7rem] font-semibold leading-tight sm:text-xs">{r.texto}</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Toque em um dia marcado para ver o que aconteceu. Dia sem marca significa que a fonte oficial não publicou {legenda} — não quer dizer falta.</p>
      {dia && (
        <div className="mt-4 border-2 border-foreground p-4">
          <div className="flex items-center justify-between"><p className="text-lg font-bold">{dia.split("-").reverse().join("/")} · {doDia.length} {legenda}</p><button onClick={() => setDia(null)} aria-label="Fechar" className="min-h-10 min-w-10"><X className="h-5 w-5" /></button></div>
          <ul className="mt-2 divide-y divide-border">
            {doDia.map((it, i) => (
              <li key={i} className="py-2"><span className="text-sm text-muted-foreground">{it.tipo}</span>
                <p className="font-semibold">{it.url ? <a className="link-evidence inline-flex items-center gap-1" href={it.url} target="_blank" rel="noreferrer">{it.titulo}<ExternalLink className="h-4 w-4" aria-hidden /></a> : it.titulo}</p>
                {it.detalhe && <p className="text-muted-foreground">{it.detalhe}</p>}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
