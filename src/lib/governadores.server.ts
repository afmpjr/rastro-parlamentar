import { Unzip, UnzipInflate } from "fflate";

export const urlCand = (ano: number) => `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_${ano}.zip`;
export const urlBens = (ano: number) => `https://cdn.tse.jus.br/estatistica/sead/odsele/bem_candidato/bem_candidato_${ano}.zip`;

export type Bem = { tipo: string; descricao: string; valor: number };
export type Governador = {
  ano: number; uf: string; sq: string; nomeUrna: string; nome: string; numero: string; partido: string; partidoNome: string;
  coligacao: string; composicao: string; nascimento: string; genero: string; instrucao: string; ocupacao: string;
  resultado: string; turno: number; vice: { nome: string; partido: string } | null; bens: Bem[]; patrimonio: number;
  /** chave interna para ligar a mesma pessoa entre eleições; nunca enviada ao navegador */
  _cpf?: string;
};

function latin1(b: Uint8Array) {
  let s = "";
  for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192));
  return s;
}
/** Divide uma linha CSV com ";" respeitando aspas (o TSE mistura campos com e sem aspas). */
function campos(l: string) {
  const out: string[] = []; let cur = "", q = false;
  for (let i = 0; i < l.length; i++) {
    const ch = l[i];
    if (q) { if (ch === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ";") { out.push(cur); cur = ""; } else if (ch !== "\r") cur += ch;
  }
  out.push(cur); return out;
}

/** Lê todos os CSVs do ZIP oficial em fluxo, linha a linha. */
async function lerZip(url: string, linha: (g: (n: string) => string) => void) {
  const r = await fetch(url);
  if (!r.ok || !r.body) throw new Error(`TSE respondeu ${r.status} em ${url}`);
  await new Promise<void>((resolve, reject) => {
    let pend = 0, fimEntrada = false;
    const talvezFim = () => { if (fimEntrada && pend === 0) resolve(); };
    const uz = new Unzip((f) => {
      if (!f.name.endsWith(".csv") || /BRASIL/i.test(f.name)) { f.ondata = () => {}; f.start(); return; }
      pend++;
      let cab: string[] | null = null, resto = "";
      f.ondata = (err, chunk, final) => {
        if (err) return reject(err);
        const ls = (resto + latin1(chunk)).split("\n");
        resto = final ? "" : ls.pop() ?? "";
        for (const l of ls) {
          if (!l.trim()) continue;
          const v = campos(l);
          if (!cab) { cab = v; continue; }
          const c = cab;
          linha((n) => v[c.indexOf(n)] ?? "");
        }
        if (final) { pend--; talvezFim(); }
      };
      f.start();
    });
    uz.register(UnzipInflate);
    (async () => {
      const rd = r.body!.getReader();
      for (;;) {
        const { done, value } = await rd.read();
        if (done) { uz.push(new Uint8Array(0), true); break; }
        uz.push(value);
      }
      fimEntrada = true; talvezFim();
    })().catch(reject);
  });
}

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;
const cache = new Map<number, { t: number; p: Promise<Governador[]> }>();

/** Governadores eleitos numa eleição geral, com vice e bens declarados ao TSE. */
export function governadoresEleitos(ano: number): Promise<Governador[]> {
  const c = cache.get(ano);
  if (c && Date.now() - c.t < 6 * 3600_000) return c.p;
  const p = carregar(ano);
  p.catch(() => cache.delete(ano));
  cache.set(ano, { t: Date.now(), p });
  return p;
}

async function carregar(ano: number): Promise<Governador[]> {
  const govs = new Map<string, Governador>();
  const vices: { uf: string; numero: string; nome: string; partido: string }[] = [];
  await lerZip(urlCand(ano), (g) => {
    const cargo = g("CD_CARGO");
    if (cargo !== "3" && cargo !== "4") return;
    if (g("DS_SIT_TOT_TURNO") !== "ELEITO") return;
    if (cargo === "4") { vices.push({ uf: g("SG_UF"), numero: g("NR_CANDIDATO"), nome: g("NM_URNA_CANDIDATO"), partido: g("SG_PARTIDO") }); return; }
    govs.set(g("SQ_CANDIDATO"), {
      ano, uf: g("SG_UF"), sq: g("SQ_CANDIDATO"), nomeUrna: g("NM_URNA_CANDIDATO"), nome: g("NM_CANDIDATO"), numero: g("NR_CANDIDATO"),
      partido: g("SG_PARTIDO"), partidoNome: g("NM_PARTIDO"), coligacao: g("NM_COLIGACAO"), composicao: g("DS_COMPOSICAO_COLIGACAO"),
      nascimento: g("DT_NASCIMENTO"), genero: g("DS_GENERO"), instrucao: g("DS_GRAU_INSTRUCAO"), ocupacao: g("DS_OCUPACAO"),
      resultado: g("DS_SIT_TOT_TURNO"), turno: Number(g("NR_TURNO")), vice: null, bens: [], patrimonio: 0, _cpf: g("NR_CPF_CANDIDATO"),
    });
  });
  for (const v of vices) {
    const gv = [...govs.values()].find((x) => x.uf === v.uf && x.numero === v.numero);
    if (gv) gv.vice = { nome: v.nome, partido: v.partido };
  }
  await lerZip(urlBens(ano), (g) => {
    const gv = govs.get(g("SQ_CANDIDATO"));
    if (!gv) return;
    const valor = num(g("VR_BEM_CANDIDATO"));
    gv.bens.push({ tipo: g("DS_TIPO_BEM_CANDIDATO"), descricao: g("DS_BEM_CANDIDATO"), valor });
    gv.patrimonio += valor;
  });
  for (const gv of govs.values()) gv.bens.sort((a, b) => b.valor - a.valor);
  return [...govs.values()].sort((a, b) => a.uf.localeCompare(b.uf));
}
