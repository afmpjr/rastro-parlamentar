import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { logosPartidos } from "@/lib/fontes.functions";
import { foto } from "@/lib/foto";

export const logosQuery = { queryKey: ["logos-partidos"], queryFn: () => logosPartidos(), staleTime: 3600_000 };

export function LogoPartido({ sigla, className = "h-5 w-5" }: { sigla: string; className?: string }) {
  const { data } = useQuery(logosQuery);
  const u = data?.logos[sigla.toUpperCase()];
  return u ? <img src={foto(u)} alt="" className={`${className} shrink-0 object-contain`} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : null;
}

export function PartidoLink({ sigla, className = "" }: { sigla: string; className?: string }) {
  if (!sigla || sigla === "—") return <span>{sigla}</span>;
  return <Link to="/partido/$sigla" params={{ sigla }} className={`inline-flex items-center gap-1.5 underline decoration-dotted underline-offset-2 hover:text-primary ${className}`}><LogoPartido sigla={sigla} />{sigla}</Link>;
}

export function UfLink({ uf, className = "" }: { uf: string; className?: string }) {
  if (!uf || uf === "—") return <span>{uf}</span>;
  return <Link to="/estado/$uf" params={{ uf }} className={`underline decoration-dotted underline-offset-2 hover:text-primary ${className}`}>{uf}</Link>;
}
