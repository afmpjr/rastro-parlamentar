import { useMemo } from "react";
import { Activity } from "lucide-react";
import { Selo } from "@/components/Fontes";

const DIAS = ["", "seg", "", "qua", "", "sex", ""];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Grade estilo GitHub: uma célula por dia nas últimas 53 semanas. */
export function GradeAtividade({ datas, titulo, legenda }: { datas: string[]; titulo: string; legenda: string }) {
  const { semanas, max, total, ativos, mesesPos } = useMemo(() => {
    const cont = new Map<string, number>();
    for (const d of datas) { const k = d.slice(0, 10); cont.set(k, (cont.get(k) ?? 0) + 1); }
    const hoje = new Date(); hoje.setUTCHours(0, 0, 0, 0);
    const ini = new Date(hoje); ini.setUTCDate(ini.getUTCDate() - 364 - ini.getUTCDay());
    const semanas: { k: string; n: number; futuro: boolean }[][] = [];
    const mesesPos: { i: number; m: number }[] = [];
    let total = 0, ativos = 0, max = 0;
    for (let w = 0, d = new Date(ini); w < 53; w++) {
      const col: { k: string; n: number; futuro: boolean }[] = [];
      for (let i = 0; i < 7; i++, d.setUTCDate(d.getUTCDate() + 1)) {
        const k = iso(d), n = cont.get(k) ?? 0, futuro = d > hoje;
        if (d.getUTCDate() === 1) mesesPos.push({ i: w, m: d.getUTCMonth() });
        if (!futuro) { total += n; if (n) ativos++; max = Math.max(max, n); }
        col.push({ k, n, futuro });
      }
      semanas.push(col);
    }
    return { semanas, max, total, ativos, mesesPos };
  }, [datas]);
  const nivel = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / (max || 1)) * 4)));
  const cor = ["var(--secondary)", "color-mix(in oklch, var(--primary) 30%, var(--secondary))", "color-mix(in oklch, var(--primary) 55%, var(--secondary))", "color-mix(in oklch, var(--primary) 80%, var(--secondary))", "var(--primary)"];

  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 border-b-2 border-foreground pb-1 text-2xl font-bold"><Activity className="h-6 w-6" aria-hidden />{titulo}</h2>
      <p className="label-caps mt-3">{total} registros em {ativos} dias nos últimos 12 meses <Selo tipo="calculo" /></p>
      <div className="mt-3 overflow-x-auto">
        <div className="inline-block">
          <div className="relative ml-8 h-4 text-[10px] text-muted-foreground">
            {mesesPos.map(({ i, m }) => <span key={`${i}-${m}`} className="absolute" style={{ left: i * 14 }}>{MESES[m]}</span>)}
          </div>
          <div className="flex gap-[3px]">
            <div className="mr-1 flex w-7 flex-col gap-[3px] text-[10px] text-muted-foreground">{DIAS.map((d, i) => <span key={i} className="h-[11px] leading-[11px]">{d}</span>)}</div>
            {semanas.map((col, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {col.map((c) => (
                  <div key={c.k} title={c.futuro ? "" : `${c.k.split("-").reverse().join("/")}: ${c.n} ${legenda}`}
                    className="h-[11px] w-[11px]" style={{ background: c.futuro ? "transparent" : cor[nivel(c.n)] }} />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            menos {cor.map((c, i) => <span key={i} className="h-[11px] w-[11px]" style={{ background: c }} />)} mais
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Cada quadrado é um dia; a cor indica quantos {legenda} houve. Ausência de registro não significa falta injustificada.</p>
    </section>
  );
}
