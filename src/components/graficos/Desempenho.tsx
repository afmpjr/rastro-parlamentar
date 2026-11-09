import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, Vote, FileText, CalendarCheck } from "lucide-react";
import { Selo } from "@/components/Fontes";

const CORES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const tip = { background: "var(--background)", border: "1px solid var(--foreground)", borderRadius: 0, fontSize: 12 };
export type Indicador = { rotulo: string; valor: string; icone: "votos" | "propostas" | "agenda" | "tendencia"; detalhe?: ReactNode };
const ICONES = { votos: Vote, propostas: FileText, agenda: CalendarCheck, tendencia: TrendingUp };

export function contar(itens: string[]) {
  const m = new Map<string, number>();
  for (const i of itens) if (i) m.set(i, (m.get(i) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([nome, n]) => ({ nome, n }));
}

export function Desempenho({ indicadores, barras, pizza }: {
  indicadores: Indicador[];
  barras: { titulo: string; dados: { nome: string; n: number }[] };
  pizza: { titulo: string; dados: { nome: string; n: number }[] };
}) {
  const [aberto, setAberto] = useState<string | null>(null);
  const det = indicadores.find((i) => i.rotulo === aberto)?.detalhe;
  const totalP = pizza.dados.reduce((s, d) => s + d.n, 0);
  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 border-b-2 border-foreground pb-1 text-2xl font-bold"><TrendingUp className="h-6 w-6" aria-hidden />Desempenho</h2>
      <div className="mt-4 grid grid-cols-2 gap-px border border-foreground bg-foreground md:grid-cols-4">
        {indicadores.map((i) => { const I = ICONES[i.icone]; const on = aberto === i.rotulo; const corpo = (<>
            <I className="h-5 w-5 text-primary" aria-hidden />
            <p className="mt-2 text-3xl font-bold">{i.valor}</p>
            <p className="label-caps mt-1 flex items-center gap-1">{i.rotulo}{i.detalhe && <ChevronDown className={`h-3 w-3 transition-transform ${on ? "rotate-180" : ""}`} aria-hidden />}</p></>);
          return i.detalhe
            ? <button key={i.rotulo} type="button" aria-expanded={on} onClick={() => setAberto(on ? null : i.rotulo)} className={`p-4 text-left ${on ? "bg-secondary" : "bg-background hover:bg-secondary"}`}>{corpo}</button>
            : <div key={i.rotulo} className="bg-background p-4">{corpo}</div>; })}
      </div>
      {det && <div>{det}</div>}
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <p className="label-caps">{barras.titulo} <Selo tipo="calculo" /></p>
          <div className="mt-2 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barras.dados}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={{ stroke: "var(--foreground)" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={32} />
                <Tooltip contentStyle={tip} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="n" name="Quantidade" fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="label-caps">{pizza.titulo} <Selo tipo="calculo" /></p>
          <div className="mt-2 flex items-center gap-4">
            <div className="h-56 w-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pizza.dados} dataKey="n" nameKey="nome" innerRadius={50} outerRadius={90} stroke="var(--background)">
                    {pizza.dados.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1 text-sm">{pizza.dados.slice(0, 8).map((d, i) => (
              <li key={d.nome} className="flex items-center gap-2"><span className="h-3 w-3 shrink-0" style={{ background: CORES[i % CORES.length] }} />
                {d.nome} <span className="text-muted-foreground">{d.n} · {((d.n / (totalP || 1)) * 100).toFixed(0)}%</span></li>))}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}
