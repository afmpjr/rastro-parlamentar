import { useEffect, useState } from "react";

const ESCALAS = [{ v: "90", r: "A-", d: "Letra menor" }, { v: "100", r: "A", d: "Letra padrão" }, { v: "120", r: "A+", d: "Letra grande" }];
const CHAVE = "tamanho-letra";

export function TamanhoFonte() {
  const [atual, setAtual] = useState("100");
  useEffect(() => { const s = localStorage.getItem(CHAVE); if (s && ESCALAS.some((e) => e.v === s)) setAtual(s); }, []);
  useEffect(() => { document.documentElement.style.fontSize = atual === "100" ? "" : `${atual}%`; }, [atual]);
  return (
    <div role="group" aria-label="Tamanho da letra" className="flex items-center gap-1">
      <span className="mr-1 text-xs text-muted-foreground">Tamanho da letra:</span>
      {ESCALAS.map((e) => (
        <button key={e.v} type="button" aria-pressed={atual === e.v} aria-label={e.d} title={e.d}
          onClick={() => { setAtual(e.v); localStorage.setItem(CHAVE, e.v); }}
          className={`min-h-10 min-w-10 rounded-sm border px-2 font-bold ${atual === e.v ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}>
          {e.r}
        </button>
      ))}
    </div>
  );
}
