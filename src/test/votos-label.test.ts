import { describe, expect, it } from "vitest";

import { ROTULO_VOTO, explicaVoto, rotuloVoto } from "@/lib/votos-label";

// Os códigos vêm do campo siglaVotoParlamentar e as descrições, do campo
// descricaoVotoParlamentar, ambos da API de votações do Senado.
describe("Rótulos de voto", () => {
  it("traduz P-NRV como presente que não registrou voto", () => {
    expect(rotuloVoto("P-NRV")).toBe("Presente, não registrou voto");
    expect(explicaVoto("P-NRV")).toMatch(/não registrou voto nessa votação nominal/);
  });

  it("traduz os demais códigos publicados pelo Senado", () => {
    expect(rotuloVoto("NCom")).toBe("Não compareceu");
    expect(rotuloVoto("MIS")).toBe("Missão da Casa no país ou no exterior");
    expect(rotuloVoto("AP")).toBe("Atividade parlamentar");
    expect(rotuloVoto("LS")).toBe("Licença por motivo de saúde");
    expect(rotuloVoto("LP")).toBe("Licença particular");
    expect(rotuloVoto("LAP")).toBe("Licença paternidade ou ao adotante");
    expect(rotuloVoto("NA")).toBe("Dispositivo não citado");
    expect(rotuloVoto("Votou")).toBe("Votou (votação secreta)");
    expect(rotuloVoto("Presidente (art. 51 RISF)")).toBe("Presidiu a sessão (art. 51 do regimento)");
  });

  it("deixa passar os votos que a fonte já publica por extenso", () => {
    for (const v of ["Sim", "Não", "Abstenção", "Obstrução", "Artigo 17"]) {
      expect(rotuloVoto(v)).toBe(v);
      expect(explicaVoto(v)).toBe("");
    }
  });

  it("devolve vazio para quem não tem registro de voto", () => {
    expect(rotuloVoto("")).toBe("");
    expect(rotuloVoto(undefined)).toBe("");
    expect(ROTULO_VOTO[""]).toBeUndefined();
  });
});
