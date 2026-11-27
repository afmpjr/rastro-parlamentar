import { X } from "lucide-react";

export type Chip = { rotulo: string; aoRemover: () => void };

/** Faixa de filtros ativos: cada critério pode ser removido sozinho, ou todos de uma vez. */
export function FiltrosAtivos({ chips, aoLimpar }: { chips: Chip[]; aoLimpar: () => void }) {
  if (!chips.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2" role="region" aria-label="Filtros ativos">
      <span className="text-sm text-muted-foreground">Filtrando por:</span>
      {chips.map((c) => (
        <button key={c.rotulo} type="button" onClick={c.aoRemover} aria-label={`Remover filtro ${c.rotulo}`}
          className="inline-flex min-h-8 items-center gap-1.5 border border-primary bg-secondary px-2.5 py-1 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground">
          {c.rotulo}<X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ))}
      {chips.length > 1 && <button type="button" onClick={aoLimpar} className="min-h-8 px-2 text-sm font-semibold underline">Limpar todos</button>}
    </div>
  );
}
