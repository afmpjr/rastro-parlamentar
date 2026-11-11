import { createServerFn } from "@tanstack/react-start";
import type { Fonte } from "./fontes.functions";
import type { Governador } from "./governadores.server";

export type { Governador, Bem } from "./governadores.server";
const MANDATO = 2022, ELEITOS = 2026;
const limpa = ({ _cpf, ...g }: Governador) => g as Governador;
const fontes = (anos: number[], comBens: boolean): Fonte[] => {
  const { urlCand, urlBens } = { urlCand: (a: number) => `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_${a}.zip`, urlBens: (a: number) => `https://cdn.tse.jus.br/estatistica/sead/odsele/bem_candidato/bem_candidato_${a}.zip` };
  const t = new Date().toISOString();
  return anos.flatMap((a) => [{ orgao: `TSE · candidaturas ${a}`, url: urlCand(a), coletadoEm: t }, ...(comBens ? [{ orgao: `TSE · bens declarados ${a}`, url: urlBens(a), coletadoEm: t }] : [])]);
};

export const listarGovernadores = createServerFn({ method: "GET" }).handler(async () => {
  const { governadoresEleitos } = await import("./governadores.server");
  const [atuais, eleitos] = await Promise.all([governadoresEleitos(MANDATO), governadoresEleitos(ELEITOS).catch(() => [] as Governador[])]);
  return {
    atuais: atuais.map((g) => ({ ...limpa(g), bens: [] })),
    eleitos: eleitos.map((g) => ({ ...limpa(g), bens: [], reeleito: atuais.some((a) => a._cpf && a._cpf === g._cpf) })),
    anoMandato: MANDATO, anoEleitos: ELEITOS, fontes: fontes([MANDATO, ELEITOS], true),
  };
});

export const governadorDaUf = createServerFn({ method: "GET" })
  .inputValidator((d: { uf: string }) => ({ uf: String(d.uf).toUpperCase().slice(0, 2) }))
  .handler(async ({ data }) => {
    const { governadoresEleitos } = await import("./governadores.server");
    const [atuais, eleitos] = await Promise.all([governadoresEleitos(MANDATO), governadoresEleitos(ELEITOS).catch(() => [] as Governador[])]);
    const atual = atuais.find((g) => g.uf === data.uf) ?? null;
    const eleito = eleitos.find((g) => g.uf === data.uf) ?? null;
    const mesmaPessoa = !!(atual?._cpf && atual._cpf === eleito?._cpf);
    return { uf: data.uf, atual: atual && limpa(atual), eleito: eleito && limpa(eleito), mesmaPessoa, anoMandato: MANDATO, anoEleitos: ELEITOS, fontes: fontes([MANDATO, ELEITOS], true) };
  });
