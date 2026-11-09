// Classificação editorial da plataforma (não é dado oficial): posição do partido frente ao governo federal.
export type Bloco = "governo" | "independente" | "oposicao";
const MAPA: Record<string, Bloco> = {
  PT: "governo", PCdoB: "governo", PV: "governo", PSOL: "governo", REDE: "governo", PSB: "governo", PDT: "governo",
  MDB: "independente", PSD: "independente", "UNIÃO": "independente", PP: "independente", REPUBLICANOS: "independente",
  PODE: "independente", AVANTE: "independente", SOLIDARIEDADE: "independente", PRD: "independente", CIDADANIA: "independente", PSDB: "independente",
  PL: "oposicao", NOVO: "oposicao",
};
export const bloco = (sigla: string): Bloco => MAPA[sigla] ?? "independente";
export const ROTULO_BLOCO: Record<Bloco, string> = { governo: "Base do governo", independente: "Independentes / centro", oposicao: "Oposição" };
export const ORDEM_BLOCO: Bloco[] = ["governo", "independente", "oposicao"];
