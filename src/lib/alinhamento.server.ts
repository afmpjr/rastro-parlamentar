// Base de votações nominais de plenário por casa/ano, usada para comparar parlamentares e no teste de compatibilidade.
import { urlVotos, urlVotacoes } from "./votos.server";

const CAMARA = "https://dadosabertos.camara.leg.br/api/v2";
const SENADO = "https://legis.senado.leg.br/dadosabertos";
export const urlVotProp = (ano: number) => `https://dadosabertos.camara.leg.br/arquivos/votacoesProposicoes/csv/votacoesProposicoes-${ano}.csv`;
export type Casa = "camara" | "senado";
export type Vt = { id: string; data: string; descricao: string; identificacao: string; idProp: string; ementa: string; aprovada: boolean | null; sim: number; nao: number };
export type Base = { votacoes: Map<string, Vt>; votos: Map<string, Map<string, [string, string]>>; parl: Map<string, { nome: string; partido: string; uf: string }>; fontes: string[] };

async function* linhas(url: string) {
  const r = await fetch(url);
  if (!r.ok || !r.body) throw new Error(`Arquivo respondeu ${r.status}`);
  const rd = r.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await rd.read();
    if (value) buf += value;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) { yield buf.slice(0, i); buf = buf.slice(i + 1); }
    if (done) { if (buf) yield buf; return; }
  }
}
const campos = (l: string) => l.replace(/^\uFEFF/, "").trim().replace(/^"|"$/g, "").split('";"');

async function camara(ano: number): Promise<Base> {
  const votacoes = new Map<string, Vt>();
  let first = true;
  for await (const l of linhas(urlVotacoes(ano))) {
    if (first) { first = false; continue; }
    const f = campos(l); if (f.length < 19 || f[6] !== "PLEN") continue;
    votacoes.set(f[0]!, { id: f[0]!, data: f[2]!, descricao: f[13]!, identificacao: "", idProp: f[18] && f[18] !== "0" ? f[18] : "", ementa: "", aprovada: f[9] === "1" ? true : f[9] === "0" ? false : null, sim: Number(f[10]) || 0, nao: Number(f[11]) || 0 });
  }
  const votos = new Map<string, Map<string, [string, string]>>();
  const parl = new Map<string, { nome: string; partido: string; uf: string }>();
  first = true;
  for await (const l of linhas(urlVotos(ano))) {
    if (first) { first = false; continue; }
    const f = campos(l); if (f.length < 10 || !votacoes.has(f[0]!)) continue;
    let m = votos.get(f[0]!); if (!m) { m = new Map(); votos.set(f[0]!, m); }
    m.set(f[4]!, [f[3]!, f[7]!]);
    parl.set(f[4]!, { nome: f[6]!, partido: f[7]!, uf: f[9]! });
  }
  for (const k of [...votacoes.keys()]) if (!votos.has(k)) votacoes.delete(k);
  try {
    const PRI = (t: string) => (/^(PEC|PLP|PL|MPV|PLV|PDL|PRC)$/.test(t) ? 0 : 1);
    const melhor = new Map<string, number>();
    for await (const l of linhas(urlVotProp(ano))) {
      const f = campos(l); if (f.length < 12) continue;
      const v = votacoes.get(f[0]!); if (!v) continue;
      const pr = PRI(f[9]!); if ((melhor.get(f[0]!) ?? 9) <= pr) continue;
      melhor.set(f[0]!, pr); v.idProp = f[4]!; v.identificacao = f[6]!; v.ementa = f[7]!;
    }
  } catch { /* opcional: sem o arquivo, ficam só as descrições */ }
  return { votacoes, votos, parl, fontes: [urlVotacoes(ano), urlVotos(ano), urlVotProp(ano)] };
}

async function senado(ano: number): Promise<Base> {
  const url = `${SENADO}/votacao?ano=${ano}`;
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`Senado respondeu ${r.status}`);
  const lista: any[] = await r.json();
  const votacoes = new Map<string, Vt>(); const votos = new Map<string, Map<string, [string, string]>>(); const parl = new Map<string, { nome: string; partido: string; uf: string }>();
  for (const z of lista) {
    if (z.votacaoSecreta === "S" || !z.votos?.length) continue;
    const id = String(z.codigoSessaoVotacao);
    votacoes.set(id, { id, data: z.dataSessao, descricao: z.descricaoVotacao ?? "", identificacao: z.identificacao ?? "", idProp: z.idProcesso ? String(z.idProcesso) : "", ementa: z.ementa ?? "", aprovada: z.resultadoVotacao === "A" ? true : z.resultadoVotacao === "R" ? false : null, sim: z.totalVotosSim ?? 0, nao: z.totalVotosNao ?? 0 });
    const m = new Map<string, [string, string]>();
    for (const q of z.votos) { const pid = String(q.codigoParlamentar); m.set(pid, [q.siglaVotoParlamentar ?? "", q.siglaPartidoParlamentar ?? ""]); parl.set(pid, { nome: q.nomeParlamentar, partido: q.siglaPartidoParlamentar ?? "", uf: q.siglaUFParlamentar ?? "" }); }
    votos.set(id, m);
  }
  return { votacoes, votos, parl, fontes: [url] };
}

const cache = new Map<string, { t: number; p: Promise<Base> }>();
export function base(casa: Casa, ano: number) {
  const k = `${casa}:${ano}`;
  let c = cache.get(k);
  if (!c || Date.now() - c.t > 3600_000) { c = { t: Date.now(), p: casa === "camara" ? camara(ano) : senado(ano) }; cache.set(k, c); c.p.catch(() => cache.delete(k)); }
  return c.p;
}

const ementas = new Map<string, string>();
export async function ementaCamara(id: string) {
  if (!id) return "";
  if (ementas.has(id)) return ementas.get(id)!;
  try { const r = await fetch(`${CAMARA}/proposicoes/${id}`, { headers: { accept: "application/json" } }); const d = (await r.json()).dados; const e = `${d.siglaTipo} ${d.numero}/${d.ano}|${d.ementa ?? ""}`; ementas.set(id, e); return e; } catch { return ""; }
}
export const posicao = (v: string | undefined) => (v === "Sim" ? "Sim" : v === "Não" ? "Não" : null);

// Explica em linguagem simples o que estava sendo decidido, a partir da descrição oficial.
export function oQueSeDecidia(d: string) {
  const t = d.toLowerCase();
  if (/urg[êe]ncia/.test(t)) return "Acelerar a tramitação (pedido de urgência)";
  if (/reda[çc][ãa]o final/.test(t)) return "Texto final do projeto";
  if (/destaque|emenda aglutinativa|emenda/.test(t)) return "Mudança em parte do texto (emenda ou destaque)";
  if (/substitutivo/.test(t)) return "Versão alternativa do texto (substitutivo)";
  if (/recurso/.test(t)) return "Recurso contra decisão de comissão";
  if (/retirada de pauta|adiamento|encerramento da discuss|requerimento/.test(t)) return "Procedimento: pauta, adiamento ou andamento da sessão";
  if (/parecer/.test(t)) return "Parecer do relator";
  if (/projeto|proposta|medida provis|pec|texto/.test(t)) return "O projeto em si (mérito)";
  return "";
}
