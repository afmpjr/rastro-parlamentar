import { describe, it, expect } from "vitest";
import { modoVencedor } from "@/lib/preferencia.functions";
describe("modo padrão da atividade", () => {
  it("usa o mapa quando a maioria escolheu o mapa", () => expect(modoVencedor(3, 5)).toBe("mapa"));
  it("usa o cartão quando a maioria escolheu o cartão", () => expect(modoVencedor(5, 3)).toBe("cartao"));
  it("empate fica no cartão", () => expect(modoVencedor(0, 0)).toBe("cartao"));
});
