import { createServerFn } from "@tanstack/react-start";
import type { Fonte } from "./fontes.functions";

const fonte = (orgao: string, url: string): Fonte => ({ orgao, url, coletadoEm: new Date().toISOString() });
const valAno = (a: unknown) => { const n = Number(a); if (!Number.isInteger(n) || n < 2019 || n > 2100) throw new Error("ano inválido"); return n; };
const valCasa = (c: unknown) => (c === "senado" ? "senado" : "camara") as "camara" | "senado";
const nomeFonte = (casa: string, u: string) => `${casa === "camara" ? "Câmara" : "Senado"} — ${u.includes("votacoesVotos") ? "votos (arquivo)" : u.includes("votacoes-") ? "votações (arquivo)" : "votações"}`;

export const compararParlamentares = createServerFn({ method: "GET" })
  .inputValidator((d: { casa: string; ano: number; ids: string[] }) => {
    const ids = [...new Set((d.ids ?? []).filter((x) => /^\d{1,9}$/.test(x)))].slice(0, 4);
    if (ids.length < 1) throw new Error("Escolha ao menos um parlamentar");
    return { casa: valCasa(d.casa), ano: valAno(d.ano), ids };
  })
  .handler(async ({ data }) => {
    const { base, posicao } = await import("./alinhamento.server");
    const b = await base(data.casa, data.ano);
    const perfis = data.ids.map((id) => {
      const p = b.parl.get(id);
      let total = 0, sim = 0, nao = 0, outros = 0, fiel = 0, comPartido = 0;
      for (const [vid, m] of b.votos) {
        const v = m.get(id); if (!v) continue;
        total++; const pos = posicao(v[0]);
        if (pos === "Sim") sim++; else if (pos === "Não") nao++; else outros++;
        if (!pos) continue;
        let s = 0, n = 0;
        for (const [pid, w] of m) if (pid !== id && w[1] === v[1]) { if (w[0] === "Sim") s++; else if (w[0] === "Não") n++; }
        if (s === n) continue;
        comPartido++; if ((s > n ? "Sim" : "Não") === pos) fiel++;
        void vid;
      }
      return { id, nome: p?.nome ?? "", partido: p?.partido ?? "", uf: p?.uf ?? "", total, sim, nao, outros, fidelidade: comPartido ? Math.round((fiel / comPartido) * 100) : null, totalVotacoes: b.votacoes.size };
    });
    const pares: { a: string; b: string; comum: number; iguais: number }[] = [];
    for (let i = 0; i < data.ids.length; i++) for (let j = i + 1; j < data.ids.length; j++) {
      let comum = 0, iguais = 0;
      for (const m of b.votos.values()) { const x = posicao(m.get(data.ids[i]!)?.[0]), y = posicao(m.get(data.ids[j]!)?.[0]); if (!x || !y) continue; comum++; if (x === y) iguais++; }
      pares.push({ a: data.ids[i]!, b: data.ids[j]!, comum, iguais });
    }
    const votacoes = [...b.votacoes.values()].sort((x, y) => y.data.localeCompare(x.data)).flatMap((v) => {
      const m = b.votos.get(v.id)!; const vs = data.ids.map((id) => m.get(id)?.[0] ?? "");
      if (vs.every((x) => !x)) return [];
      const ps = vs.map(posicao).filter(Boolean);
      return [{ id: v.id, data: v.data, descricao: v.descricao, identificacao: v.identificacao, idProp: v.idProp, aprovada: v.aprovada, votos: vs, diverge: new Set(ps).size > 1 }];
    });
    return { perfis, pares, votacoes, fontes: b.fontes.map((u) => fonte(nomeFonte(data.casa, u), u)) };
  });

export const votacoesDoTeste = createServerFn({ method: "GET" })
  .inputValidator((d: { casa: string; ano: number }) => ({ casa: valCasa(d.casa), ano: valAno(d.ano) }))
  .handler(async ({ data }) => {
    const { base, ementaCamara } = await import("./alinhamento.server");
    const b = await base(data.casa, data.ano);
    const porProp = new Map<string, (typeof b.votacoes extends Map<string, infer V> ? V : never)>();
    for (const v of b.votacoes.values()) {
      const tot = v.sim + v.nao; if (tot < (data.casa === "camara" ? 200 : 40)) continue;
      const min = Math.min(v.sim, v.nao) / tot; if (min < 0.15) continue;
      const k = v.idProp || v.id; const atual = porProp.get(k);
      if (!atual || tot > atual.sim + atual.nao) porProp.set(k, v);
    }
    const escolhidas = [...porProp.values()].sort((x, y) => y.data.localeCompare(x.data)).slice(0, 20);
    const itens = await Promise.all(escolhidas.map(async (v) => {
      let identificacao = v.identificacao, ementa = v.ementa;
      if (data.casa === "camara" && v.idProp) { const e = await ementaCamara(v.idProp); if (e) { const [i, em] = e.split("|"); identificacao = i ?? identificacao; ementa = em ?? ""; } }
      return { id: v.id, data: v.data, descricao: v.descricao, identificacao, ementa, idProp: v.idProp, aprovada: v.aprovada, sim: v.sim, nao: v.nao };
    }));
    return { itens, fontes: b.fontes.map((u) => fonte(nomeFonte(data.casa, u), u)) };
  });

export const calcularCompatibilidade = createServerFn({ method: "POST" })
  .inputValidator((d: { casa: string; ano: number; respostas: Record<string, string> }) => {
    const r: Record<string, "Sim" | "Não"> = {};
    for (const [k, v] of Object.entries(d.respostas ?? {}).slice(0, 40)) if (/^[\w-]{1,20}$/.test(k) && (v === "Sim" || v === "Não")) r[k] = v;
    return { casa: valCasa(d.casa), ano: valAno(d.ano), respostas: r };
  })
  .handler(async ({ data }) => {
    const { base, posicao } = await import("./alinhamento.server");
    const b = await base(data.casa, data.ano);
    const acc = new Map<string, { comum: number; iguais: number }>();
    for (const [vid, minha] of Object.entries(data.respostas)) {
      const m = b.votos.get(vid); if (!m) continue;
      for (const [pid, w] of m) { const p = posicao(w[0]); if (!p) continue; const a = acc.get(pid) ?? { comum: 0, iguais: 0 }; a.comum++; if (p === minha) a.iguais++; acc.set(pid, a); }
    }
    const ranking = [...acc].filter(([, a]) => a.comum >= 3).map(([id, a]) => ({ id, ...b.parl.get(id)!, ...a, pct: Math.round((a.iguais / a.comum) * 100) })).sort((x, y) => y.pct - x.pct || y.comum - x.comum);
    return { ranking, respondidas: Object.keys(data.respostas).length };
  });
