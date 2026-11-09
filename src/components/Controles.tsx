import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, X } from "lucide-react";
import { ptBR } from "date-fns/locale";

export function Marcar({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="rounded-none" />
      {children}
    </label>
  );
}

export function Segmentos<T extends string>({ value, onChange, opcoes, rotulo }: { value: T; onChange: (v: T) => void; opcoes: { v: T; l: string }[]; rotulo: string }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="inline-flex border border-foreground">
      {opcoes.map((o) => (
        <button key={o.v} role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}
          className={`px-3 py-1 text-sm ${value === o.v ? "bg-foreground text-background" : "hover:bg-muted"}`}>{o.l}</button>
      ))}
    </div>
  );
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const deIso = (s: string) => { const [a, m, d] = s.split("-").map(Number); return new Date(a!, (m ?? 1) - 1, d ?? 1); };
export function EscolhaData({ value, onChange, min, max, rotulo }: { value: string; onChange: (v: string) => void; min?: string | undefined; max?: string | undefined; rotulo: string }) {
  return (
    <Popover>
      <PopoverTrigger aria-label={rotulo} className="flex items-center gap-2 border border-border bg-background px-2 py-1 text-sm">
        <CalendarDays className="h-4 w-4" aria-hidden />{value ? value.split("-").reverse().join("/") : <span className="text-muted-foreground">{rotulo}</span>}
        {value && <span role="button" tabIndex={0} aria-label={`Limpar ${rotulo}`} onClick={(e) => { e.stopPropagation(); onChange(""); }}><X className="h-3 w-3" aria-hidden /></span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-none p-0" align="start">
        <Calendar mode="single" locale={ptBR} {...(value ? { selected: deIso(value), defaultMonth: deIso(value) } : max ? { defaultMonth: deIso(max) } : {})}
          disabled={(d) => (!!min && iso(d) < min) || (!!max && iso(d) > max)} onSelect={(d) => onChange(d ? iso(d) : "")} />
      </PopoverContent>
    </Popover>
  );
}
