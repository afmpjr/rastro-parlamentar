/** Página oficial de consulta para quem não quer baixar arquivo. Devolve null quando a fonte já é uma página. */
export function paginaDe(url: string): string | null {
  if (/cdn\.tse\.jus\.br\/.*\/(consulta_cand|bem_candidato)_\d{4}\.zip/.test(url)) return "https://divulgacandcontas.tse.jus.br/divulga/#/home";
  const ceap = url.match(/camara\.leg\.br\/cotas\/Ano-(\d{4})\.csv\.zip/);
  if (ceap) return `https://www.camara.leg.br/transparencia/gastos-parlamentares?ano=${ceap[1]}`;
  if (/portaldatransparencia\.gov\.br\/download-de-dados\/emendas|dadosabertos-download\.cgu\.gov\.br\/.*emendas/i.test(url)) return "https://portaldatransparencia.gov.br/emendas/consulta";
  return null;
}
export const ehArquivo = (url: string) => /\.(zip|csv)(\?|$)|download-de-dados/i.test(url);
