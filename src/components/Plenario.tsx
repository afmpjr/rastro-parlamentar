import { Checkbox } from "@/components/ui/checkbox";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Armchair } from "lucide-react";
import { Selo } from "@/components/Fontes";
import { useDica } from "@/components/Dica";
import type { Fonte, Parlamentar } from "@/lib/fontes.functions";

// Paleta de visualização com cores bem distintas; atribuída pela ordem de tamanho da bancada.
const PALETA = ["#1f77b4", "#d62728", "#2ca02c", "#ff7f0e", "#9467bd", "#8c564b", "#e377c2", "#17becf", "#bcbd22", "#7f7f7f",
  "#393b79", "#ad494a", "#637939", "#e7ba52", "#843c39", "#7b4173", "#3182bd", "#31a354", "#fd8d3c", "#756bb1", "#636363", "#de9ed6", "#6baed6", "#e6550d"];

/** Distribui n cadeiras em fileiras semicirculares sem sobreposição. */
function assentos(n: number) {
  const cap = (s: number) => { let c = 0; for (let r = 1; r >= 0.4 - 1e-9; r -= s) c += Math.floor((Math.PI * r) / s); return c; };
  let lo = 0.005, hi = 0.5;
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (cap(m) >= n) lo = m; else hi = m; }
  const s = lo, raios: number[] = [];
  for (let r = 1; r >= 0.4 - 1e-9; r -= s) raios.push(r);
  const capTot = raios.reduce((a, r) => a + Math.floor((Math.PI * r) / s), 0);
  const pts: { x: number; y: number; a: number }[] = [];
  let resto = n;
  raios.forEach((r, i) => {
    const max = Math.floor((Math.PI * r) / s);
    const k = i === raios.length - 1 ? resto : Math.min(resto, Math.round((max * n) / capTot)); resto -= k;
    for (let j = 0; j < k; j++) { const a = k === 1 ? Math.PI / 2 : Math.PI - (Math.PI * j) / (k - 1); pts.push({ x: +(r * Math.cos(a)).toFixed(4), y: +(r * Math.sin(a)).toFixed(4), a }); }
  });
  return { pts: pts.sort((p, q) => q.a - p.a), raio: +(s * 0.42).toFixed(4) };
}

export function Plenario({ lista, fontes }: { lista: Parlamentar[]; fontes: Fonte[] }) {
  const { ref, mostrar, esconder, dica } = useDica();
  const [casa, setCasa] = useState<"camara" | "senado">("camara");
  const [marcados, setMarcados] = useState<string[]>([]);
  const nav = useNavigate();
  const { ocup, raio, partidos, cores } = useMemo(() => {
    const ps = lista.filter((p) => p.casa === casa);
    const cont = new Map<string, number>(); for (const p of ps) cont.set(p.partido, (cont.get(p.partido) ?? 0) + 1);
    const partidos = [...cont.entries()].map(([s, n]) => ({ s, n })).sort((a, b) => b.n - a.n || a.s.localeCompare(b.s));
    const ordem = new Map(partidos.map((p, i) => [p.s, i]));
    const cores = new Map(partidos.map((p, i) => [p.s, PALETA[i % PALETA.length]!]));
    const ord = [...ps].sort((a, b) => ordem.get(a.partido)! - ordem.get(b.partido)! || a.nome.localeCompare(b.nome));
    const { pts, raio } = assentos(ord.length);
    return { ocup: ord.map((p, i) => ({ p, x: pts[i]?.x ?? 0, y: pts[i]?.y ?? 0 })), raio, partidos, cores };
  }, [lista, casa]);
  const ativo = (s: string) => marcados.length === 0 || marcados.includes(s);
  const nMarc = ocup.filter((o) => marcados.includes(o.p.partido)).length;
  const btn = (on: boolean) => `border px-2 py-1 text-xs ${on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`;
  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 border-b-2 border-foreground pb-1 text-2xl font-bold"><Armchair className="h-6 w-6" aria-hidden />Mapa do plenário</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={btn(casa === "camara")} onClick={() => { setCasa("camara"); setMarcados([]); }}>Câmara</button>
        <button className={btn(casa === "senado")} onClick={() => { setCasa("senado"); setMarcados([]); }}>Senado</button>
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_16rem]">
        <div ref={ref} className="relative">
        <svg viewBox="-1.04 -1.04 2.08 1.1" className="w-full" role="img" aria-label="Cadeiras agrupadas por partido">
          {ocup.map(({ p, x, y }) => (
            <circle key={p.id} cx={x} cy={-y} r={raio} fill={cores.get(p.partido)} opacity={ativo(p.partido) ? 1 : 0.12}
              className="cursor-pointer" onMouseMove={(e) => mostrar(e, <><b>{p.nome}</b> · {p.partido}-{p.uf}</>)} onMouseLeave={esconder} onClick={() => nav(p.casa === "camara" ? { to: "/deputado/$id", params: { id: p.id } } : { to: "/senador/$id", params: { id: p.id } })}><desc>{`${p.nome} (${p.partido}-${p.uf})`}</desc></circle>
          ))}
          <text x="0" y="-0.1" textAnchor="middle" fontSize="0.16" fontWeight="700" fill="var(--foreground)">{marcados.length ? nMarc : ocup.length}</text>
          <text x="0" y="-0.01" textAnchor="middle" fontSize="0.05" fill="var(--muted-foreground)">{marcados.length ? `de ${ocup.length} cadeiras` : "cadeiras ocupadas"}</text>
        </svg>
        {dica}
        </div>
        <fieldset>
          <legend className="label-caps flex w-full items-center justify-between">Partidos {marcados.length > 0 && <button className="link-evidence normal-case" onClick={() => setMarcados([])}>limpar</button>}</legend>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 lg:grid-cols-1">
            {partidos.map((p) => (
              <li key={p.s}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox className="rounded-none" checked={marcados.includes(p.s)} onCheckedChange={() => setMarcados((m) => (m.includes(p.s) ? m.filter((x) => x !== p.s) : [...m, p.s]))} />
                  <span className="h-3 w-3 rounded-full" style={{ background: cores.get(p.s) }} />
                  <span className="flex-1">{p.s}</span><span className="text-muted-foreground">{p.n}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Partidos e cadeiras: <Selo tipo="oficial" url={fontes[casa === "camara" ? 0 : 1]?.url} /> As cadeiras são agrupadas por partido, da maior para a menor bancada. A posição é ilustrativa: Câmara e Senado não divulgam lugares fixos no plenário. Clique numa cadeira para abrir o perfil.</p>
    </section>
  );
}
