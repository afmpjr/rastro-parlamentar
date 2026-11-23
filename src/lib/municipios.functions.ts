import { createServerFn } from "@tanstack/react-start";

export type Municipio = { nome: string; uf: string };
const URL_IBGE = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado";
let cache: { em: number; lista: Municipio[]; coletadoEm: string } | null = null;

/** Lista oficial de municípios do IBGE (nome + UF), com cache de 24h. */
export const listarMunicipios = createServerFn({ method: "GET" }).handler(async () => {
  if (!cache || Date.now() - cache.em > 864e5) {
    const r = await fetch(URL_IBGE);
    if (!r.ok) throw new Error(`IBGE respondeu ${r.status}`);
    const j = (await r.json()) as Record<string, string>[];
    cache = { em: Date.now(), coletadoEm: new Date().toISOString(), lista: j.map((m) => ({ nome: String(m["municipio-nome"]), uf: String(m["UF-sigla"]) })) };
  }
  return { lista: cache.lista, fontes: [{ orgao: "IBGE — Municípios", url: URL_IBGE, coletadoEm: cache.coletadoEm }] };
});
