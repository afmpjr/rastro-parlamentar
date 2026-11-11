import { lerZip } from "./governadores.server";

export const URL_EMENDAS = "https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares/UNICO";
const URL_ZIP = "https://dadosabertos-download.cgu.gov.br/PortalDaTransparencia/saida/emendas-parlamentares/EmendasParlamentares.zip";

/** [ano, tipo, autor, município, uf, função, empenhado, pago] */
export type Linha = [number, string, string, string, string, string, number, number];
const num = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;
let cache: { t: number; p: Promise<Linha[]> } | null = null;

export function emendas(): Promise<Linha[]> {
  if (cache && Date.now() - cache.t < 12 * 3600_000) return cache.p;
  const p = (async () => {
    const out: Linha[] = [];
    await lerZip(URL_ZIP, (g) => {
      out.push([Number(g("Ano da Emenda")), g("Tipo de Emenda"), g("Nome do Autor da Emenda"), g("Município"), g("UF"), g("Nome Função"), num(g("Valor Empenhado")), num(g("Valor Pago"))]);
    }, (n) => n === "EmendasParlamentares.csv");
    return out;
  })();
  p.catch(() => { cache = null; });
  cache = { t: Date.now(), p };
  return p;
}
