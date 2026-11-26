import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parlamentaresQuery } from "@/lib/parlamentares-query";
import { foto } from "@/lib/foto";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
export function AutorEmendas({ autor, uf }: { autor: string; uf: string }) {
  const { data, isPending, isError } = useQuery({ ...parlamentaresQuery, enabled: !!autor });
  if (!autor) return null;
  const encontrados = data?.lista.filter((p) => norm(p.nome) === norm(autor) && (!uf || p.uf === uf)) ?? [];
  const p = encontrados.length === 1 ? encontrados[0] : undefined;
  return <section className="mt-6 border-y border-border py-4" aria-label="Autor selecionado">
    {!p ? <p className="text-sm text-muted-foreground">{isPending ? "Consultando identificação do autor…" : isError ? "Identificação do autor indisponível no momento." : `Autor selecionado: ${autor}. Não foi possível associá-lo com segurança a um único parlamentar em exercício; pode ser uma bancada ou um ex-parlamentar.`}</p> : <div className="flex flex-wrap items-center gap-4">
      <img src={foto(p.foto)} alt={`Foto oficial de ${p.nome}`} width={64} height={80} className="h-20 w-16 rounded-sm bg-secondary object-cover" />
      <div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">{p.nome}</h2><p className="text-sm">{p.casa === "camara" ? "Deputado federal" : "Senador"} · {p.partido} · {p.uf}</p><p className="mt-1 text-xs text-muted-foreground">Identificação atual, que pode diferir do partido ou cargo no ano da emenda.</p></div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="h-auto min-h-10 whitespace-normal"><Link to={p.casa === "camara" ? "/deputado/$id" : "/senador/$id"} params={{ id: p.id }}>Ver atuação e perfil</Link></Button>
        <Button asChild className="h-auto min-h-10 whitespace-normal"><a href={p.casa === "camara" ? `https://www.camara.leg.br/deputados/${p.id}` : `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${p.id}`} target="_blank" rel="noreferrer">Contatos oficiais do gabinete<ArrowUpRight aria-hidden /><span className="sr-only"> (abre em nova aba)</span></a></Button>
      </div>
    </div>}
  </section>;
}