import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarCheck,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Scale,
  TrendingUp,
  Vote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Selo } from "@/components/Fontes";
import { foto } from "@/lib/foto";
import { cn } from "@/lib/utils";
import { rotuloVoto } from "@/lib/votos-label";
import { iconeCategoria, type Desp } from "@/components/graficos/Despesas";
import type { VotoItem } from "@/components/graficos/Votos";

export type AbaPerfil = "visao" | "despesas" | "atividade" | "votacoes" | "proposicoes" | "comissoes";

const ABAS: { value: AbaPerfil; label: string }[] = [
  { value: "visao", label: "Visão geral" },
  { value: "despesas", label: "Despesas" },
  { value: "atividade", label: "Atividade" },
  { value: "votacoes", label: "Votações" },
  { value: "proposicoes", label: "Proposições" },
  { value: "comissoes", label: "Comissões" },
];

export function CabecalhoPerfil({
  id,
  casa,
  nome,
  partido,
  uf,
  fotoUrl,
  funcao,
  fonteUrl,
  paginaOficial,
  situacao,
  mandato,
  detalhes,
  email,
}: {
  id: string;
  casa: "camara" | "senado";
  nome: string;
  partido: string;
  uf: string;
  fotoUrl: string;
  funcao: string;
  fonteUrl: string;
  paginaOficial: string;
  situacao?: string | null;
  mandato?: string | null;
  detalhes: (string | null | undefined)[];
  email?: string | null;
}) {
  return (
    <>
      <nav aria-label="Você está em" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/parlamentares" className="hover:text-primary hover:underline">Parlamentares</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span>{casa === "camara" ? "Câmara dos Deputados" : "Senado Federal"}</span>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span aria-current="page" className="text-foreground">Perfil</span>
      </nav>
      <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
        <img
          src={foto(fotoUrl)}
          alt={`Foto oficial de ${nome}`}
          width={160}
          height={192}
          className="h-40 w-32 shrink-0 rounded-md border border-border bg-secondary object-cover sm:h-48 sm:w-40"
        />
        <div className="min-w-0 flex-1">
          <p className="label-caps flex flex-wrap items-center gap-2">
            {funcao} <Selo tipo="oficial" url={fonteUrl} />
          </p>
          <h1 className="mt-2 break-words text-3xl font-bold leading-tight sm:text-5xl">{nome}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-base sm:text-lg">
            {partido && partido !== "—" ? <Link to="/partido/$sigla" params={{ sigla: partido }} className="font-semibold text-primary hover:underline">{partido}</Link> : <span>{partido}</span>}
            <span aria-hidden>·</span>
            {uf && uf !== "—" ? <Link to="/estado/$uf" params={{ uf }} className="font-semibold text-primary hover:underline">{uf}</Link> : <span>{uf}</span>}
            {situacao && <span className="ml-1 rounded-sm bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{situacao}</span>}
          </div>
          {mandato && <p className="mt-1 text-sm text-muted-foreground">{mandato}</p>}
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            {detalhes.filter(Boolean).length > 0 && <p className="break-words">{detalhes.filter(Boolean).join(" · ")}</p>}
            {email && <a href={`mailto:${email}`} className="inline-block break-all hover:text-primary hover:underline">{email}</a>}
          </div>
          <div className="mt-5 flex flex-col gap-2 min-[420px]:flex-row">
            <Button asChild size="sm" className="min-h-10 rounded-sm">
              <a href={paginaOficial} target="_blank" rel="noreferrer">
                Página oficial <ArrowUpRight aria-hidden />
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="min-h-10 rounded-sm bg-transparent">
              <Link to="/comparar" search={{ casa, ano: new Date().getFullYear(), ids: id }}>
                <Scale aria-hidden /> Comparar perfil
              </Link>
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}

export function NavegacaoPerfil({ valor, aoMudar, conteudos }: {
  valor: AbaPerfil;
  aoMudar: (aba: AbaPerfil) => void;
  conteudos: Partial<Record<AbaPerfil, ReactNode>>;
}) {
  const disponiveis = ABAS.filter((aba) => conteudos[aba.value]);
  return (
    <Tabs value={valor} onValueChange={(v) => aoMudar(v as AbaPerfil)} className="mt-8">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList aria-label="Seções do perfil" className="flex h-auto w-max min-w-full justify-start gap-5 rounded-none border-b bg-transparent p-0 text-muted-foreground sm:gap-7">
          {disponiveis.map((aba) => (
            <TabsTrigger
              key={aba.value}
              value={aba.value}
              className="relative min-h-12 shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-0 py-3 text-sm font-medium shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {aba.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {disponiveis.map((aba) => <TabsContent key={aba.value} value={aba.value} className="mt-6">{conteudos[aba.value]}</TabsContent>)}
    </Tabs>
  );
}

type IconeMetrica = "votos" | "propostas" | "agenda" | "tendencia" | "despesas";
const ICONES = { votos: Vote, propostas: FileText, agenda: CalendarCheck, tendencia: TrendingUp, despesas: CircleDollarSign };

export function MetricasResumo({ itens }: {
  itens: {
    rotulo: string;
    valor: string;
    icone: IconeMetrica;
    tipo: "oficial" | "calculo";
    fonte?: string;
    explica?: string | undefined;
  }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {itens.map((item) => {
        const Icone = ICONES[item.icone];
        return (
          <div key={item.rotulo} className="flex min-w-0 flex-col rounded-lg border bg-card p-3.5 shadow-sm sm:p-4">
            <div className="flex items-start gap-2">
              <Icone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <p className="text-xs leading-snug text-muted-foreground sm:text-sm">{item.rotulo}</p>
            </div>
            <p className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">{item.valor}</p>
            <div className="mt-auto pt-3"><Selo tipo={item.tipo} url={item.fonte} explica={item.explica} /></div>
          </div>
        );
      })}
    </div>
  );
}

export function CartaoPerfil({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("min-w-0 rounded-lg border bg-card p-4 shadow-sm sm:p-5", className)}>{children}</div>;
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const brlResumido = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });

export function ResumoDespesas({ despesas, aoVerTodas }: { despesas: Desp[]; aoVerTodas: () => void }) {
  const anos = despesas.map((d) => d.ano);
  const ano = anos.length ? Math.max(...anos) : null;
  const doAno = ano ? despesas.filter((d) => d.ano === ano) : [];
  const total = doAno.reduce((s, d) => s + d.valor, 0);
  const categorias = [...doAno.reduce((m, d) => m.set(d.tipo, (m.get(d.tipo) ?? 0) + d.valor), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maior = categorias[0]?.[1] ?? 1;
  return (
    <CartaoPerfil className="flex h-full flex-col">
      <div className="flex flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Despesas por categoria</h2>
          <p className="mt-1 text-xs text-muted-foreground">{ano ? `${ano} · ${brl(total)}` : "Nenhuma despesa retornada"}</p>
        </div>
        <Selo tipo="calculo" explica={`Somamos as despesas oficiais de ${ano ?? "período disponível"} e agrupamos por categoria. As quatro maiores categorias aparecem neste resumo.`} />
      </div>
      <ul className="mt-5 space-y-4">
        {categorias.map(([tipo, valor]) => {
          const Icone = iconeCategoria(tipo);
          return (
            <li key={tipo}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2"><Icone className="h-4 w-4 shrink-0 text-primary" aria-hidden /><span className="truncate" title={tipo}>{tipo}</span></span>
                <span className="shrink-0 font-medium">{brlResumido(valor)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${(valor / maior) * 100}%` }} /></div>
            </li>
          );
        })}
        {categorias.length === 0 && <li className="text-sm text-muted-foreground">A fonte oficial não retornou despesas para este perfil.</li>}
      </ul>
      <Button variant="link" onClick={aoVerTodas} className="mt-auto self-start px-0 pt-5">Ver todas as despesas <ArrowRight aria-hidden /></Button>
    </CartaoPerfil>
  );
}

function classeVoto(voto: string) {
  const v = rotuloVoto(voto).toLocaleLowerCase("pt-BR");
  if (v === "sim") return "bg-primary/10 text-primary";
  if (v.includes("não") || v.includes("nao")) return "bg-destructive/10 text-destructive";
  return "bg-secondary text-secondary-foreground";
}

export function VotacoesRecentes({ votos, aoVerTodas }: { votos: VotoItem[]; aoVerTodas: () => void }) {
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Votações recentes</h2>
        <Button variant="link" onClick={aoVerTodas} className="px-0">Ver todas <ArrowRight aria-hidden /></Button>
      </div>
      <ul className="mt-3 overflow-hidden rounded-lg border bg-card shadow-sm">
        {votos.slice(0, 3).map((v, i) => (
          <li key={`${v.data}-${v.titulo}-${i}`} className="grid gap-3 border-b p-4 last:border-b-0 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center">
            <time className="text-xs text-muted-foreground">{v.data.split("-").reverse().join("/")}</time>
            <div className="min-w-0">
              <p className="font-semibold">{v.titulo}</p>
              {v.descricao && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{v.descricao}</p>}
              {v.url && <a href={v.url} target="_blank" rel="noreferrer" className="link-evidence mt-1 inline-flex items-center gap-1 text-xs">Fonte da votação <ArrowUpRight className="h-3 w-3" aria-hidden /></a>}
            </div>
            <span className={cn("w-fit rounded-full px-3 py-1 text-xs font-semibold", classeVoto(v.voto))}>{rotuloVoto(v.voto) || "Sem registro"}</span>
          </li>
        ))}
        {votos.length === 0 && <li className="p-4 text-sm text-muted-foreground">Nenhuma votação nominal retornada.</li>}
      </ul>
    </section>
  );
}

export function ProposicoesRecentes({ proposicoes, aoVerTodas }: {
  proposicoes: { id: number; sigla: string; data: string; ementa: string }[];
  aoVerTodas: () => void;
}) {
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Proposições recentes</h2>
        <Button variant="link" onClick={aoVerTodas} className="px-0">Ver todas <ArrowRight aria-hidden /></Button>
      </div>
      <ul className="mt-3 overflow-hidden rounded-lg border bg-card shadow-sm">
        {proposicoes.slice(0, 3).map((p) => (
          <li key={p.id} className="border-b p-4 last:border-b-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <a href={`https://www.camara.leg.br/propostas-legislativas/${p.id}`} target="_blank" rel="noreferrer" className="link-evidence inline-flex items-center gap-1 font-semibold">{p.sigla}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></a>
              <time className="text-xs text-muted-foreground">{p.data.slice(0, 10).split("-").reverse().join("/")}</time>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.ementa}</p>
          </li>
        ))}
        {proposicoes.length === 0 && <li className="p-4 text-sm text-muted-foreground">Nenhuma proposição retornada.</li>}
      </ul>
    </section>
  );
}

export function TituloSecao({ icone: Icone = BarChart3, titulo, fonte }: { icone?: typeof BarChart3; titulo: string; fonte?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b pb-3">
      <Icone className="h-5 w-5 text-primary" aria-hidden />
      <h2 className="font-display text-2xl font-bold">{titulo}</h2>
      {fonte && <Selo tipo="oficial" url={fonte} />}
    </div>
  );
}
