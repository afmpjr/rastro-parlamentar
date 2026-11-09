import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Building2, CalendarDays, CalendarRange, Car, Fuel, Hotel, Megaphone, Phone, Plane, Receipt, ShieldCheck, Utensils, BookOpen, Briefcase, Calendar, Tags,
} from "lucide-react";
import { Selo } from "@/components/Fontes";

export type Desp = { data: string; ano: number; mes: number; tipo: string; fornecedor: string; cnpjCpf: string; valor: number };
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const brlCurto = (v: number) => v.toLocaleString("pt-BR", { notation: "compact", style: "currency", currency: "BRL" });
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function iconeCategoria(t: string) {
  const s = t.toLowerCase();
  if (s.includes("combust")) return Fuel;
  if (s.includes("aéreo") || s.includes("aeronave") || s.includes("passage")) return Plane;
  if (s.includes("veículo") || s.includes("locomo") || s.includes("táxi") || s.includes("pedágio")) return Car;
  if (s.includes("divulga")) return Megaphone;
  if (s.includes("telefon") || s.includes("postais")) return Phone;
  if (s.includes("hosped")) return Hotel;
  if (s.includes("aliment")) return Utensils;
  if (s.includes("escritório") || s.includes("imóve")) return Building2;
  if (s.includes("segurança")) return ShieldCheck;
  if (s.includes("publica") || s.includes("assinatura") || s.includes("curso")) return BookOpen;
  if (s.includes("consultor") || s.includes("contrata")) return Briefcase;
  return Receipt;
}

type Escala = "dia" | "mes" | "ano";
const ESCALAS: { v: Escala; rotulo: string; Icone: typeof Calendar }[] = [
  { v: "dia", rotulo: "Dia", Icone: CalendarDays },
  { v: "mes", rotulo: "Mês", Icone: Calendar },
  { v: "ano", rotulo: "Ano", Icone: CalendarRange },
];

export function ExploradorDespesas({ despesas, titulo }: { despesas: Desp[]; titulo: string }) {
  const anos = useMemo(() => [...new Set(despesas.map((d) => d.ano))].sort((a, b) => b - a), [despesas]);
  const [escala, setEscala] = useState<Escala>("mes");
  const [ano, setAno] = useState<number | "todos">(anos[0] ?? "todos");
  const [cat, setCat] = useState<string | null>(null);

  const doAno = despesas.filter((d) => (escala === "ano" || ano === "todos" ? true : d.ano === ano));
  const filtradas = cat ? doAno.filter((d) => d.tipo === cat) : doAno;
  const total = filtradas.reduce((s, d) => s + d.valor, 0);

  const serie = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of filtradas) {
      const k = escala === "ano" ? String(d.ano) : escala === "mes" ? `${d.ano}-${String(d.mes).padStart(2, "0")}` : d.data.slice(0, 10);
      if (!k) continue;
      m.set(k, (m.get(k) ?? 0) + d.valor);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({
      k, v, rotulo: escala === "mes" ? `${MESES[Number(k.slice(5, 7)) - 1]}/${k.slice(2, 4)}` : escala === "dia" ? `${k.slice(8, 10)}/${k.slice(5, 7)}` : k,
    }));
  }, [filtradas, escala]);

  const porCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of doAno) m.set(d.tipo, (m.get(d.tipo) ?? 0) + d.valor);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [doAno]);
  const totalAno = porCat.reduce((s, [, v]) => s + v, 0);

  const porForn = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of filtradas) m.set(`${d.fornecedor} (${d.cnpjCpf})`, (m.get(`${d.fornecedor} (${d.cnpjCpf})`) ?? 0) + d.valor);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [filtradas]);

  const btn = (ativo: boolean) => `inline-flex items-center gap-1.5 border px-3 py-1.5 text-sm transition-colors ${ativo ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`;

  return (
    <section className="mt-12">
      <h2 className="border-b-2 border-foreground pb-1 text-2xl font-bold">{titulo}</h2>
      {despesas.length === 0 ? <p className="mt-4 text-muted-foreground">A fonte oficial não retornou despesas no período consultado.</p> : (<>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="label-caps mr-1">Agrupar por</span>
          {ESCALAS.map(({ v, rotulo, Icone }) => (
            <button key={v} type="button" className={btn(escala === v)} onClick={() => setEscala(v)}><Icone className="h-4 w-4" aria-hidden />{rotulo}</button>
          ))}
          {escala !== "ano" && (<>
            <span className="label-caps ml-4 mr-1">Ano</span>
            {anos.map((a) => <button key={a} type="button" className={btn(ano === a)} onClick={() => setAno(a)}>{a}</button>)}
            <button type="button" className={btn(ano === "todos")} onClick={() => setAno("todos")}>Todos</button>
          </>)}
        </div>
        {cat && (
          <p className="mt-3 inline-flex items-center gap-2 border border-foreground px-3 py-1 text-sm">
            <Tags className="h-4 w-4" aria-hidden /> Filtrando: {cat}
            <button type="button" className="link-evidence" onClick={() => setCat(null)}>limpar</button>
          </p>
        )}
        <p className="label-caps mt-4">{filtradas.length} notas · total {brl(total)} <Selo tipo="calculo" /></p>
        <div className="mt-2 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={{ stroke: "var(--foreground)" }} minTickGap={12} />
              <YAxis tickFormatter={brlCurto} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={70} />
              <Tooltip formatter={(v: number) => brl(v)} labelFormatter={(l) => String(l)} cursor={{ fill: "var(--secondary)" }}
                contentStyle={{ background: "var(--background)", border: "1px solid var(--foreground)", borderRadius: 0, fontSize: 12 }} />
              <Bar dataKey="v" name="Valor" fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <p className="label-caps">Por categoria · clique para filtrar <Selo tipo="calculo" /></p>
            <ul className="mt-3 space-y-1">{porCat.map(([t, v]) => {
              const Icone = iconeCategoria(t);
              return (
                <li key={t}>
                  <button type="button" onClick={() => setCat(cat === t ? null : t)} className={`w-full p-1 text-left ${cat === t ? "bg-secondary" : "hover:bg-secondary"}`}>
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="inline-flex items-start gap-2"><Icone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />{t}</span>
                      <span className="whitespace-nowrap font-medium">{brl(v)} <span className="text-muted-foreground">· {((v / (totalAno || 1)) * 100).toFixed(1)}%</span></span>
                    </div>
                    <div className="mt-1 h-2 bg-secondary"><div className="h-2 bg-primary" style={{ width: `${(v / (porCat[0]?.[1] ?? 1)) * 100}%` }} /></div>
                  </button>
                </li>);
            })}</ul>
          </div>
          <div>
            <p className="label-caps">Principais fornecedores <Selo tipo="calculo" /></p>
            <ol className="mt-3 space-y-1 text-sm">{porForn.map(([f, v]) => <li key={f} className="flex justify-between gap-4 border-b border-border py-1"><span>{f}</span><span className="whitespace-nowrap font-medium">{brl(v)}</span></li>)}</ol>
            <p className="mt-2 text-xs text-muted-foreground">Fornecedor recorrente não indica irregularidade.</p>
          </div>
        </div>
      </>)}
    </section>
  );
}
