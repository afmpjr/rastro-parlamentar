import { createServerFn } from "@tanstack/react-start";
import type { Fonte } from "./fontes.functions";

export type FiltroEmendas = { ano: number; uf: string; municipio: string; autor: string };
type Grupo = { nome: string; empenhado: number; pago: number; qtd: number };
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

export const buscarEmendas = createServerFn({ method: "GET" })
  .inputValidator((d: FiltroEmendas) => ({ ano: Number(d.ano) || 0, uf: String(d.uf ?? "").slice(0, 40), municipio: String(d.municipio ?? "").slice(0, 80), autor: String(d.autor ?? "").slice(0, 80) }))
  .handler(async ({ data }) => {
    const { bancoPublico } = await import("./dados.server");
    const { URL_EMENDAS } = await import("./emendas.server");
    const db = await bancoPublico();
    const [{ data: r, error }, { data: coleta }] = await Promise.all([
      db.rpc("resumo_emendas", { p_ano: data.ano, p_uf: data.uf, p_municipio: norm(data.municipio), p_autor: norm(data.autor) }),
      db.from("coletas").select("concluido_em").eq("fonte", "emendas").eq("status", "sucesso").order("concluido_em", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (error) { console.error("Falha ao ler emendas", error); throw new Error("Não foi possível ler as emendas guardadas."); }
    const res = r as { ano: number; anos: number[]; ufs: string[]; qtd: number; empenhado: number; pago: number; grupos: Record<string, Grupo[]> };
    const g = (k: string) => (res.grupos?.[k] ?? []).map((x) => ({ ...x, empenhado: Number(x.empenhado), pago: Number(x.pago), qtd: Number(x.qtd) }));
    // Todas as áreas (o resumo traz só as maiores); somadas aqui com os mesmos filtros.
    const linhas: { funcao: string; municipio: string; autor: string; empenhado: number; pago: number; qtd: number }[] = [];
    for (let de = 0; ; de += 1000) {
      let qy = db.from("emendas").select("funcao,municipio,autor,empenhado,pago,qtd").eq("ano", res.ano).range(de, de + 999);
      if (data.uf) qy = qy.eq("uf", data.uf);
      const { data: pg, error: e2 } = await qy;
      if (e2) { console.error("Falha ao ler áreas", e2); break; }
      linhas.push(...(pg ?? []));
      if (!pg || pg.length < 1000) break;
    }
    const pm = norm(data.municipio), pa = norm(data.autor), mapa = new Map<string, Grupo>();
    for (const l of linhas) {
      if (pm && !norm(l.municipio).includes(pm)) continue;
      if (pa && !norm(l.autor).includes(pa)) continue;
      const nome = l.funcao || "Sem informação";
      const v = mapa.get(nome) ?? { nome, empenhado: 0, pago: 0, qtd: 0 };
      v.empenhado += Number(l.empenhado); v.pago += Number(l.pago); v.qtd += Number(l.qtd); mapa.set(nome, v);
    }
    const areas = mapa.size ? [...mapa.values()].sort((a, b) => b.empenhado - a.empenhado) : g("areas");
    const fontes: Fonte[] = [{ orgao: "Portal da Transparência (CGU) · emendas parlamentares", url: URL_EMENDAS, coletadoEm: coleta?.concluido_em ?? new Date().toISOString() }];
    return {
      ano: res.ano, anos: res.anos ?? [], ufs: res.ufs ?? [], fontes, qtd: Number(res.qtd),
      empenhado: Number(res.empenhado), pago: Number(res.pago),
      autores: g("autores"), municipios: g("municipios"), areas, tipos: g("tipos"),
    };
  });
