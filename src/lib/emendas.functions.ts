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
    const fontes: Fonte[] = [{ orgao: "Portal da Transparência (CGU) · emendas parlamentares", url: URL_EMENDAS, coletadoEm: coleta?.concluido_em ?? new Date().toISOString() }];
    return {
      ano: res.ano, anos: res.anos ?? [], ufs: res.ufs ?? [], fontes, qtd: Number(res.qtd),
      empenhado: Number(res.empenhado), pago: Number(res.pago),
      autores: g("autores"), municipios: g("municipios"), areas: g("areas"), tipos: g("tipos"),
    };
  });
