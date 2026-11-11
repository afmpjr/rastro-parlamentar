import { createServerFn } from "@tanstack/react-start";
import type { Fonte } from "./fontes.functions";

export type FiltroEmendas = { ano: number; uf: string; municipio: string; autor: string };
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

export const buscarEmendas = createServerFn({ method: "GET" })
  .inputValidator((d: FiltroEmendas) => ({ ano: Number(d.ano) || 0, uf: String(d.uf ?? "").slice(0, 40), municipio: String(d.municipio ?? "").slice(0, 80), autor: String(d.autor ?? "").slice(0, 80) }))
  .handler(async ({ data }) => {
    const { emendas, URL_EMENDAS } = await import("./emendas.server");
    const todas = await emendas();
    const anos = [...new Set(todas.map((l) => l[0]))].filter(Boolean).sort((a, b) => b - a);
    const ufs = [...new Set(todas.map((l) => l[4]))].filter((u) => u && !/sem informa|m[uú]ltiplo|exterior/i.test(u)).sort();
    const ano = data.ano || anos[0];
    const m = norm(data.municipio), a = norm(data.autor);
    const sel = todas.filter((l) => l[0] === ano && (!data.uf || l[4] === data.uf) && (!m || norm(l[3]).includes(m)) && (!a || norm(l[2]).includes(a)));
    const agrupa = (i: number, n = 10) => [...sel.reduce((mp, l) => {
      const k = String(l[i] || "Sem informação"); const v = mp.get(k) ?? { nome: k, empenhado: 0, pago: 0, qtd: 0 };
      v.empenhado += l[6]; v.pago += l[7]; v.qtd++; return mp.set(k, v);
    }, new Map<string, { nome: string; empenhado: number; pago: number; qtd: number }>()).values()].sort((x, y) => y.empenhado - x.empenhado).slice(0, n);
    const fontes: Fonte[] = [{ orgao: "Portal da Transparência (CGU) · emendas parlamentares", url: URL_EMENDAS, coletadoEm: new Date().toISOString() }];
    return {
      ano, anos, ufs, fontes, qtd: sel.length,
      empenhado: sel.reduce((s, l) => s + l[6], 0), pago: sel.reduce((s, l) => s + l[7], 0),
      autores: agrupa(2), municipios: agrupa(3), areas: agrupa(5, 8), tipos: agrupa(1, 6),
    };
  });
