import { Unzip, UnzipInflate } from "fflate";

export type DespCeap = { ano: number; mes: number; tipo: string; fornecedor: string; cnpjCpf: string; valor: number; doc: string | null };
const cache = new Map<string, { t: number; dados: DespCeap[] }>();
export const urlArquivoCeap = (ano: number) => `https://www.camara.leg.br/cotas/Ano-${ano}.csv.zip`;

function campos(linha: string) {
  return linha.split('";"').map((c, i, a) => (i === 0 ? c.replace(/^\uFEFF?"/, "") : i === a.length - 1 ? c.replace(/"\r?$/, "") : c));
}

/** Baixa o ZIP anual oficial e lê o CSV em fluxo, mantendo só as linhas do deputado. */
export async function despesasDoArquivo(ano: number, id: string): Promise<DespCeap[]> {
  const k = `${ano}:${id}`;
  const c = cache.get(k);
  if (c && Date.now() - c.t < 3600_000) return c.dados;
  const r = await fetch(urlArquivoCeap(ano));
  if (!r.ok || !r.body) throw new Error(`Arquivo respondeu ${r.status}`);
  const out: DespCeap[] = [];
  let cab: string[] | null = null;
  let resto = "";
  const marca = `";"${id}";"`;
  const dec = new TextDecoder();
  const processa = (txt: string, fim: boolean) => {
    const linhas = (resto + txt).split("\n");
    resto = fim ? "" : linhas.pop() ?? "";
    for (const l of linhas) {
      if (!l) continue;
      if (!cab) { cab = campos(l); continue; }
      if (!l.includes(marca)) continue;
      const v = campos(l);
      const g = (n: string) => v[cab!.indexOf(n)] ?? "";
      if (g("ideCadastro") !== id) continue;
      out.push({
        ano: Number(g("numAno")), mes: Number(g("numMes")), tipo: g("txtDescricao"), fornecedor: g("txtFornecedor"),
        cnpjCpf: g("txtCNPJCPF"), valor: Number(g("vlrLiquido").replace(",", ".")) || 0, doc: g("urlDocumento") || null,
      });
    }
  };
  await new Promise<void>((resolve, reject) => {
    const uz = new Unzip((f) => {
      f.ondata = (err, chunk, final) => {
        if (err) return reject(err);
        processa(dec.decode(chunk, { stream: !final }), final);
        if (final) resolve();
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
    })().catch(reject);
  });
  out.sort((a, b) => b.ano - a.ano || b.mes - a.mes);
  cache.set(k, { t: Date.now(), dados: out });
  return out;
}
