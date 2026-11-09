import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Armchair } from "lucide-react";
import { Selo } from "@/components/Fontes";
import { bloco, ORDEM_BLOCO, ROTULO_BLOCO, type Bloco } from "@/lib/alinhamento";
import type { Parlamentar } from "@/lib/fontes.functions";

const COR_BLOCO: Record<Bloco, string> = { governo: "var(--chart-4)", independente: "var(--chart-2)", oposicao: "var(--chart-3)" };
// Cor por partido: matiz estável derivado da sigla (visualização de dados).
const corPartido = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return `oklch(0.62 0.15 ${h})`; };

function assentos(n: number) {
  const linhas = Math.max(4, Math.round(Math.sqrt(n / 4)));
  const raios = Array.from({ length: linhas }, (_, i) => 0.4 + (0.6 * i) / (linhas - 1));
  const soma = raios.reduce((a, b) => a + b, 0);
  const pts: { x: number; y: number; a: number }[] = [];
  let resto = n;
  raios.forEach((r, i) => {
    const k = i === linhas - 1 ? resto : Math.round((n * r) / soma); resto -= k;
    for (let j = 0; j < k; j++) { const a = Math.PI - (Math.PI * (j + 0.5)) / k; pts.push({ x: +(r * Math.cos(a)).toFixed(4), y: +(r * Math.sin(a)).toFixed(4), a }); }
  });
  return { pts: pts.sort((p, q) => q.a - p.a), raio: +(0.5 / linhas).toFixed(4) };
}

export function Plenario({ lista }: { lista: Parlamentar[] }) {
  const [casa, setCasa] = useState<"camara" | "senado">("camara");
  const [modo, setModo] = useState<"partido" | "bloco">("partido");
  const [foco, setFoco] = useState<string | null>(null);
  const nav = useNavigate();
  const { ocup, raio, partidos } = useMemo(() => {
    const ps = lista.filter((p) => p.casa === casa);
    const cont = new Map<string, number>(); for (const p of ps) cont.set(p.partido, (cont.get(p.partido) ?? 0) + 1);
    const ord = [...ps].sort((a, b) => ORDEM_BLOCO.indexOf(bloco(a.partido)) - ORDEM_BLOCO.indexOf(bloco(b.partido)) || (cont.get(b.partido)! - cont.get(a.partido)!) || a.partido.localeCompare(b.partido) || a.nome.localeCompare(b.nome));
    const { pts, raio } = assentos(ord.length);
    const partidos = [...cont.entries()].map(([s, n]) => ({ s, n, b: bloco(s) })).sort((a, b) => ORDEM_BLOCO.indexOf(a.b) - ORDEM_BLOCO.indexOf(b.b) || b.n - a.n);
    return { ocup: ord.map((p, i) => ({ p, x: pts[i]?.x ?? 0, y: pts[i]?.y ?? 0 })), raio, partidos };
  }, [lista, casa]);
  const cor = (s: string) => (modo === "partido" ? corPartido(s) : COR_BLOCO[bloco(s)]);
  const btn = (on: boolean) => `border px-2 py-1 text-xs ${on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`;
  const totBloco = ORDEM_BLOCO.map((b) => ({ b, n: partidos.filter((p) => p.b === b).reduce((s, p) => s + p.n, 0) }));
  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 border-b-2 border-foreground pb-1 text-2xl font-bold"><Armchair className="h-6 w-6" aria-hidden />Mapa do plenário</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={btn(casa === "camara")} onClick={() => setCasa("camara")}>Câmara</button>
        <button className={btn(casa === "senado")} onClick={() => setCasa("senado")}>Senado</button>
        <span className="mx-2 border-l border-border" />
        <button className={btn(modo === "partido")} onClick={() => setModo("partido")}>Cor por partido</button>
        <button className={btn(modo === "bloco")} onClick={() => setModo("bloco")}>Cor por alinhamento</button>
      </div>
      <svg viewBox="-1.05 -1.05 2.1 1.12" className="mt-4 w-full" role="img" aria-label="Distribuição das cadeiras por partido">
        {ocup.map(({ p, x, y }) => (
          <circle key={p.id} cx={x} cy={-y} r={raio * 0.85} fill={cor(p.partido)} opacity={foco && foco !== p.partido ? 0.15 : 1}
            className="cursor-pointer" onMouseEnter={() => setFoco(p.partido)} onMouseLeave={() => setFoco(null)}
            onClick={() => nav(p.casa === "camara" ? { to: "/deputado/$id", params: { id: p.id } } : { to: "/senador/$id", params: { id: p.id } })}>
            <title>{`${p.nome} (${p.partido}-${p.uf}) · ${ROTULO_BLOCO[bloco(p.partido)]}`}</title>
          </circle>
        ))}
        <text x="0" y="-0.08" textAnchor="middle" fontSize="0.14" fontWeight="700" fill="var(--foreground)">{ocup.length}</text>
        <text x="0" y="0.02" textAnchor="middle" fontSize="0.05" fill="var(--muted-foreground)">{foco ? `${foco}: ${partidos.find((p) => p.s === foco)?.n}` : "cadeiras ocupadas"}</text>
      </svg>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {totBloco.map(({ b, n }) => (
          <div key={b}>
            <p className="label-caps flex items-center gap-2"><span className="h-3 w-3" style={{ background: COR_BLOCO[b] }} />{ROTULO_BLOCO[b]} · {n}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {partidos.filter((p) => p.b === b).map((p) => (
                <button key={p.s} onMouseEnter={() => setFoco(p.s)} onMouseLeave={() => setFoco(null)} onClick={() => nav({ to: "/parlamentares", search: { q: p.s } })}
                  className="inline-flex items-center gap-1 border border-border px-2 py-0.5 text-xs hover:border-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: cor(p.s) }} />{p.s} {p.n}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Partidos e cadeiras: <Selo tipo="oficial" /> Alinhamento com o governo: <Selo tipo="calculo" /> classificação editorial por partido; parlamentares podem votar diferente do seu partido. Clique numa cadeira para abrir o perfil.</p>
    </section>
  );
}
