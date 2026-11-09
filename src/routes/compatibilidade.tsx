import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { HeartHandshake, ThumbsUp, ThumbsDown, SkipForward, RotateCcw } from "lucide-react";
import { votacoesDoTeste, calcularCompatibilidade } from "@/lib/alinhamento.functions";
import { Fontes, Selo } from "@/components/Fontes";
import { Escolha } from "@/components/Escolha";

const ANO = new Date().getFullYear();
export const Route = createFileRoute("/compatibilidade")({
  head: () => ({ meta: [
    { title: "Teste de compatibilidade com parlamentares — Plenário Aberto" },
    { name: "description", content: "Responda como você votaria em votações reais do Congresso e veja quais deputados e senadores votaram mais parecido com você." },
    { property: "og:title", content: "Qual parlamentar vota como você? — Plenário Aberto" },
    { property: "og:description", content: "Teste baseado em votações nominais reais, com fonte oficial." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Teste,
});

const campo = "border border-input bg-card px-3 py-2";
type Resp = Record<string, "Sim" | "Não" | "pular">;

function Teste() {
  const [casa, setCasa] = useState<"camara" | "senado">("camara");
  const [ano, setAno] = useState(ANO);
  const chave = `compat:${casa}:${ano}`;
  const [resp, setResp] = useState<Resp>({});
  const [uf, setUf] = useState("");
  useEffect(() => { try { setResp(JSON.parse(localStorage.getItem(chave) ?? "{}")); } catch { setResp({}); } }, [chave]);
  const salvar = (r: Resp) => { setResp(r); localStorage.setItem(chave, JSON.stringify(r)); };
  const q = useQuery({ queryKey: ["teste", casa, ano], queryFn: () => votacoesDoTeste({ data: { casa, ano } }), staleTime: 3600_000 });
  const calc = useServerFn(calcularCompatibilidade);
  const m = useMutation({ mutationFn: () => calc({ data: { casa, ano, respostas: Object.fromEntries(Object.entries(resp).filter(([, v]) => v !== "pular")) } }) });
  const itens = q.data?.itens ?? [];
  const validas = itens.filter((v) => resp[v.id] === "Sim" || resp[v.id] === "Não").length;
  const ufs = [...new Set((m.data?.ranking ?? []).map((p) => p.uf))].sort();
  const rank = (m.data?.ranking ?? []).filter((p) => !uf || p.uf === uf);
  return (
    <div>
      <h1 className="flex items-center gap-3 text-4xl font-bold"><HeartHandshake className="h-8 w-8 text-primary" aria-hidden />Teste de compatibilidade</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Estas são votações reais e disputadas do plenário. Diga como você votaria e descubra quem votou mais parecido com você. Suas respostas ficam só neste aparelho.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Escolha className="w-56" rotulo="Casa" value={casa} onChange={(v) => { setCasa(v as "camara" | "senado"); m.reset(); }} opcoes={[{ v: "camara", l: "Deputados (Câmara)" }, { v: "senado", l: "Senadores (Senado)" }]} />
        <Escolha className="w-28" rotulo="Ano" value={String(ano)} onChange={(v) => { setAno(Number(v)); m.reset(); }} opcoes={[ANO, ANO - 1, ANO - 2].map((a) => ({ v: String(a), l: String(a) }))} />
        <button className="flex items-center gap-1 border border-input px-3 py-2" onClick={() => { salvar({}); m.reset(); }}><RotateCcw className="h-4 w-4" aria-hidden />Recomeçar</button>
      </div>
      {q.isLoading ? <p className="mt-8 text-muted-foreground">Escolhendo votações nos arquivos oficiais… pode levar alguns segundos.</p>
        : q.error ? <p role="alert" className="mt-8">Não foi possível carregar as votações: {(q.error as Error).message}</p>
        : !itens.length ? <p className="mt-8">Não há votações nominais disputadas suficientes neste ano. Tente outro ano.</p> : (
          <>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">{itens.length} votações escolhidas <Selo tipo="calculo" explica="Escolhemos as votações nominais de plenário mais recentes em que o lado perdedor teve pelo menos 15% dos votos, uma por proposição. Elas mostram onde os parlamentares realmente se dividiram." /></p>
            <ol className="mt-3 space-y-4">
              {itens.map((v, i) => (
                <li key={v.id} className="border-2 border-foreground p-4">
                  <p className="label-caps">{i + 1} · {v.data.split("-").reverse().join("/")}{v.identificacao && ` · ${v.identificacao}`}</p>
                  {v.ementa && <p className="mt-1 font-medium">{v.ementa}</p>}
                  <p className="mt-1 text-sm text-muted-foreground">Em votação: {v.descricao}</p>
                  {v.idProp && <Link to="/proposicao/$casa/$id" params={{ casa, id: v.idProp }} className="text-sm underline">Ver detalhes do projeto</Link>}
                  <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`Seu voto na pergunta ${i + 1}`}>
                    {(["Sim", "Não", "pular"] as const).map((o) => {
                      const Ic = o === "Sim" ? ThumbsUp : o === "Não" ? ThumbsDown : SkipForward;
                      const ativo = resp[v.id] === o;
                      return <button key={o} aria-pressed={ativo} onClick={() => salvar({ ...resp, [v.id]: o })} className={`flex items-center gap-1 border px-3 py-1 ${ativo ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}><Ic className="h-4 w-4" aria-hidden />{o === "pular" ? "Não sei / pular" : o}</button>;
                    })}
                  </div>
                  {resp[v.id] && resp[v.id] !== "pular" && <p className="mt-2 text-xs text-muted-foreground">Resultado real: {v.aprovada == null ? "" : v.aprovada ? "aprovada" : "rejeitada"} · Sim {v.sim} × Não {v.nao}</p>}
                </li>
              ))}
            </ol>
            <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-3 border-t-2 border-foreground bg-background py-3">
              <span className="text-sm">{validas} de {itens.length} respondidas</span>
              <button disabled={validas < 5 || m.isPending} onClick={() => m.mutate()} className="bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-40">{m.isPending ? "Calculando…" : "Ver meu resultado"}</button>
              {validas < 5 && <span className="text-sm text-muted-foreground">Responda pelo menos 5.</span>}
            </div>
          </>
        )}
      {m.error && <p role="alert" className="mt-4">Não foi possível calcular: {(m.error as Error).message}</p>}
      {m.data && (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground pb-1">
            <h2 className="flex items-center gap-2 text-2xl font-bold">Quem vota como você <Selo tipo="calculo" explica="Para cada parlamentar, contamos em quantas das votações que você respondeu ele votou Sim ou Não, e em quantas o voto foi igual ao seu. Ausências e abstenções não contam. Só aparece quem votou em pelo menos 3 delas." /></h2>
            <Escolha className="w-48" rotulo="Estado" value={uf} onChange={setUf} opcoes={[{ v: "", l: "Todos os estados" }, ...ufs.map((u) => ({ v: u, l: u }))]} />
          </div>
          <ol className="mt-3 divide-y divide-border">
            {rank.slice(0, 50).map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <span className="w-8 text-right text-muted-foreground">{i + 1}</span>
                <span className="flex-1">{casa === "camara" ? <Link to="/deputado/$id" params={{ id: p.id }} className="underline">{p.nome}</Link> : <Link to="/senador/$id" params={{ id: p.id }} className="underline">{p.nome}</Link>} <span className="text-sm text-muted-foreground">{p.partido}-{p.uf}</span></span>
                <div className="hidden h-2 w-40 bg-muted sm:block"><div className="h-2 bg-primary" style={{ width: `${p.pct}%` }} /></div>
                <span className="w-24 text-right"><b>{p.pct}%</b> <span className="text-xs text-muted-foreground">{p.iguais}/{p.comum}</span></span>
              </li>
            ))}
          </ol>
          {rank.length > 50 && <p className="mt-2 text-sm text-muted-foreground">Mostrando os 50 mais compatíveis{uf && ` de ${uf}`}. Os menos compatíveis estão no fim da lista completa.</p>}
          {rank.length > 0 && <p className="mt-2 text-sm">Menos compatível{uf && ` em ${uf}`}: {rank[rank.length - 1]!.nome} ({rank[rank.length - 1]!.pct}%)</p>}
        </section>
      )}
      {q.data && <Fontes fontes={q.data.fontes} />}
    </div>
  );
}
