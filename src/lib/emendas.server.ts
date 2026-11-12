import { lerZip } from "./governadores.server";

export const URL_EMENDAS = "https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares/UNICO";
export const URL_ZIP = "https://dadosabertos-download.cgu.gov.br/PortalDaTransparencia/saida/emendas-parlamentares/EmendasParlamentares.zip";

export type Resumo = { ano: number; tipo: string; autor: string; municipio: string; uf: string; funcao: string; qtd: number; empenhado: number; pago: number };
const num = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;

/** Baixa o arquivo oficial e soma as emendas por ano, tipo, autor, município, UF e área. */
export async function baixarResumo(): Promise<Resumo[]> {
  const mapa = new Map<string, Resumo>();
  await lerZip(URL_ZIP, (g) => {
    const ano = Number(g("Ano da Emenda"));
    if (!ano) return;
    const r = { ano, tipo: g("Tipo de Emenda"), autor: g("Nome do Autor da Emenda"), municipio: g("Município"), uf: g("UF"), funcao: g("Nome Função") };
    const k = Object.values(r).join("|");
    const v = mapa.get(k) ?? { ...r, qtd: 0, empenhado: 0, pago: 0 };
    v.qtd++; v.empenhado += num(g("Valor Empenhado")); v.pago += num(g("Valor Pago"));
    mapa.set(k, v);
  }, (n) => n === "EmendasParlamentares.csv");
  return [...mapa.values()].map((v) => ({ ...v, empenhado: Math.round(v.empenhado * 100) / 100, pago: Math.round(v.pago * 100) / 100 }));
}
