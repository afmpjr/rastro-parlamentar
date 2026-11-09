import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const VAZIO = "__todos";
export function Escolha({ value, onChange, opcoes, rotulo, className = "" }: { value: string; onChange: (v: string) => void; opcoes: { v: string; l: string }[]; rotulo: string; className?: string }) {
  return (
    <Select value={value === "" ? VAZIO : value} onValueChange={(v) => onChange(v === VAZIO ? "" : v)}>
      <SelectTrigger aria-label={rotulo} className={`h-auto rounded-none border-input bg-card px-3 py-2 ${className}`}><SelectValue /></SelectTrigger>
      <SelectContent className="max-h-80 rounded-none">
        {opcoes.map((o) => <SelectItem key={o.v || VAZIO} value={o.v === "" ? VAZIO : o.v} className="rounded-none">{o.l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
