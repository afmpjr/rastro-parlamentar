// Rótulos em linguagem simples para os códigos de voto publicados pelo Senado.
// As descrições abaixo são as que a própria fonte publica no campo
// descricaoVotoParlamentar da API de votações (legis.senado.leg.br/dadosabertos/votacao),
// apenas ajustadas para caixa de frase. Nada aqui é inventado: quando a fonte não
// publica explicação além da própria sigla, a explicação diz isso.
// A Câmara publica os votos por extenso (Sim, Não, Abstenção, Obstrução, Artigo 17),
// então esses passam direto.

export const ROTULO_VOTO: Record<string, string> = {
  "P-NRV": "Presente, não registrou voto",
  "NCom": "Não compareceu",
  "MIS": "Missão da Casa no país ou no exterior",
  "AP": "Atividade parlamentar",
  "LS": "Licença por motivo de saúde",
  "LP": "Licença particular",
  "LAP": "Licença paternidade ou ao adotante",
  "NA": "Dispositivo não citado",
  "Votou": "Votou (votação secreta)",
  "Presidente (art. 51 RISF)": "Presidiu a sessão (art. 51 do regimento)",
};

export const EXPLICA_VOTO: Record<string, string> = {
  "P-NRV": "O parlamentar estava presente à sessão, mas não registrou voto nessa votação nominal. A redação é a que o Senado publica no campo descricaoVotoParlamentar.",
  "NCom": "O Senado registrou que o parlamentar não compareceu à sessão dessa votação.",
  "MIS": "O parlamentar estava em missão oficial da Casa, no país ou no exterior, e por isso não votou.",
  "AP": "O Senado registrou atividade parlamentar no horário da votação, e não um voto.",
  "LS": "O parlamentar estava afastado por licença de saúde nessa data.",
  "LP": "O parlamentar estava afastado por licença particular nessa data.",
  "LAP": "O parlamentar estava afastado por licença paternidade ou licença ao adotante nessa data.",
  "NA": "Registro oficial do Senado com esta redação; a fonte não publica explicação além dessa.",
  "Votou": "A votação foi secreta: o Senado informa que o parlamentar votou, mas não publica em quê.",
  "Presidente (art. 51 RISF)": "Quem preside a sessão não vota, pelo art. 51 do regimento do Senado.",
};

/** Rótulo legível do voto. Devolve o próprio texto quando a fonte já publica por extenso. */
export const rotuloVoto = (v: string | undefined) => ROTULO_VOTO[(v ?? "").trim()] ?? (v ?? "");

/** Explicação do voto para etiquetas; vazia quando o rótulo já se explica sozinho. */
export const explicaVoto = (v: string | undefined) => EXPLICA_VOTO[(v ?? "").trim()] ?? "";
