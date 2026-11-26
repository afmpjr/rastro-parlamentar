import { describe, expect, it } from "vitest";
import { execucaoEmendas, pedidoEmendas } from "../lib/execucao-emendas";

describe("Execução das emendas", () => {
  it("calcula a proporção e a diferença do exemplo revisado", () => {
    const r = execucaoEmendas(1195391, 154452);
    expect(r.percentual).toBeCloseTo(12.9206, 3);
    expect(r.diferenca).toBe(1040939);
    expect(r.situacao).toBe("parcial");
  });
  it("não calcula percentual sem empenho positivo", () => {
    expect(execucaoEmendas(0, 0).percentual).toBeNull();
  });
  it("preserva pagamentos acima do empenho sem esconder a diferença", () => {
    const r = execucaoEmendas(100, 120);
    expect(r.percentual).toBe(120);
    expect(r.barra).toBe(100);
    expect(r.diferenca).toBe(-20);
    expect(r.situacao).toBe("acima");
  });
  it("distingue ausência de pagamento de pagamento integral", () => {
    expect(execucaoEmendas(100, 0).situacao).toBe("sem-pagamento");
    expect(execucaoEmendas(100, 100).situacao).toBe("integral");
  });
  it("mantém cidade, autoria, período e valores no pedido agregado", () => {
    const p = pedidoEmendas({ municipio: "Nobres", uf: "MT", autor: "Nelson Barbudo", ano: 2025, empenhado: 100, pago: 20 });
    expect(p).toContain("Nobres (MT)");
    expect(p).toContain("exercício 2025");
    expect(p).toContain("Nelson Barbudo");
    expect(p).toContain("100.00");
    expect(p).toContain("20.00");
  });
});