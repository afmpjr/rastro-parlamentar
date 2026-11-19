import { describe, it, expect } from "vitest";
import { paginaDe } from "@/lib/paginas";
describe("página oficial no lugar do .zip", () => {
  it("TSE candidaturas vai para o DivulgaCandContas", () => expect(paginaDe("https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2022.zip")).toBe("https://divulgacandcontas.tse.jus.br/divulga/#/home"));
  it("CEAP da Câmara vai para a página de gastos do ano", () => expect(paginaDe("https://www.camara.leg.br/cotas/Ano-2026.csv.zip")).toBe("https://www.camara.leg.br/transparencia/gastos-parlamentares?ano=2026"));
  it("emendas vão para a consulta do Portal", () => expect(paginaDe("https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares/UNICO")).toBe("https://portaldatransparencia.gov.br/emendas/consulta"));
  it("página comum não muda", () => expect(paginaDe("https://www.camara.leg.br/deputados/1")).toBeNull());
});
