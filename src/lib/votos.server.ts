// Lê os arquivos anuais de votações da Câmara (CSV) em fluxo e indexa votos por deputado.
const BASE = "https://dadosabertos.camara.leg.br/arquivos";
export const urlVotos = (ano: number) => `${BASE}/votacoesVotos/csv/votacoesVotos-${ano}.csv`;
export const urlVotacoes = (ano: number) => `${BASE}/votacoes/csv/votacoes-${ano}.csv`;

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

export type VotoDep = { data: string; voto: string; idVotacao: string; orgao: string; descricao: string; proposicao: string; aprovada: boolean | null };
const cache = new Map<number, { t: number; p: Promise<Map<string, VotoDep[]>> }>();

async function carregar(ano: number) {
  const vot = new Map<string, { orgao: string; descricao: string; proposicao: string; aprovacao: string }>();
  let first = true;
  for await (const l of linhas(urlVotacoes(ano))) {
    if (first) { first = false; continue; }
    const f = campos(l); if (f.length < 18) continue;
    vot.set(f[0]!, { orgao: f[6]!, aprovacao: f[9]!, descricao: f[13]!, proposicao: f[17]! });
  }
  const porDep = new Map<string, VotoDep[]>();
  first = true;
  for await (const l of linhas(urlVotos(ano))) {
    if (first) { first = false; continue; }
    const f = campos(l); if (f.length < 5) continue;
    const v = vot.get(f[0]!);
    const arr = porDep.get(f[4]!) ?? []; porDep.set(f[4]!, arr);
    arr.push({ data: f[2]!.slice(0, 10), voto: f[3]!, idVotacao: f[0]!, orgao: v?.orgao ?? "", descricao: v?.descricao ?? "", proposicao: v?.proposicao ?? "", aprovada: v ? (v.aprovacao === "1" ? true : v.aprovacao === "0" ? false : null) : null });
  }
  return porDep;
}

export async function votosDoDeputado(ano: number, id: string) {
  let c = cache.get(ano);
  if (!c || Date.now() - c.t > 3600_000) { c = { t: Date.now(), p: carregar(ano) }; cache.set(ano, c); c.p.catch(() => cache.delete(ano)); }
  return ((await c.p).get(id) ?? []).sort((a, b) => b.data.localeCompare(a.data));
}
