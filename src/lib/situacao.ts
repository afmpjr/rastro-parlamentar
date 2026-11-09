// Classifica a situação oficial de uma proposição em grupos visuais. A regra é da plataforma, a partir do texto oficial.
export type Grupo = "aprovada" | "votacao" | "analise" | "sem-analise" | "arquivada" | "encerrada" | "desconhecida";
export const GRUPOS: Record<Grupo, { rotulo: string; explica: string }> = {
  aprovada: { rotulo: "Aprovada / virou lei", explica: "Aprovada, transformada em norma ou enviada à sanção." },
  votacao: { rotulo: "Pronta para votar", explica: "Na pauta ou pronta para ser votada no plenário ou em comissão." },
  analise: { rotulo: "Em análise", explica: "Aguardando parecer de relator ou em discussão em comissão." },
  "sem-analise": { rotulo: "Ainda não analisada", explica: "Recém-apresentada, aguardando despacho ou a escolha de um relator." },
  arquivada: { rotulo: "Arquivada", explica: "Arquivada; só volta a tramitar se for desarquivada." },
  encerrada: { rotulo: "Rejeitada / retirada", explica: "Rejeitada, retirada pelo autor, prejudicada ou devolvida." },
  desconhecida: { rotulo: "Situação não informada", explica: "A fonte não informou a situação." },
};
export function grupoSituacao(s: string): Grupo {
  const t = s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  if (!t.trim()) return "desconhecida";
  if (/arquivad/.test(t)) return "arquivada";
  if (/transformad|norma juridica|sancao|aprovad|remetida a (camara|sancao)|promulga|enviada ao senado|autografo/.test(t)) return "aprovada";
  if (/rejeitad|retirad|prejudicad|devolvid|vetad|declarad/.test(t)) return "encerrada";
  if (/pauta|ordem do dia|pronta|incluida/.test(t)) return "votacao";
  if (/designacao (de|do) relator|despacho|recebimento|leitura|apresentac|aguardando constituicao|aguardando criacao/.test(t)) return "sem-analise";
  return "analise";
}
export const diasParada = (data: string) => (data ? Math.floor((Date.now() - new Date(data).getTime()) / 864e5) : null);
