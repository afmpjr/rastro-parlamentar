import { createHash } from "node:crypto";
import { Unzip, UnzipInflate } from "fflate";

const CAMARA = "https://dadosabertos.camara.leg.br/api/v2";
const SENADO = "https://legis.senado.leg.br/dadosabertos";
const CEAPS = "https://adm.senado.gov.br/adm-dadosabertos/api/v1/senadores/despesas_ceaps";
export const urlArquivoCeap = (ano: number) => `https://www.camara.leg.br/cotas/Ano-${ano}.csv.zip`;

type Admin = typeof import("@/integrations/supabase/client.server").supabaseAdmin;
type Despesa = {
  casa: "camara" | "senado"; parlamentar_id: string; ano: number; mes: number; data: string;
  categoria: string; fornecedor: string; cnpj_cpf: string; valor: number; documento_url: string | null; linha_hash: string;
};

async function admin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
async function texto(url: string) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`Fonte respondeu ${r.status}`);
  return r.text();
}
function erro(e: unknown) { return e instanceof Error ? e.message : "Falha desconhecida"; }
function hash(valor: unknown) { return createHash("sha256").update(JSON.stringify(valor)).digest("hex"); }
async function emLotes<T>(itens: T[], tamanho: number, fn: (lote: T[]) => Promise<void>) {
  for (let i = 0; i < itens.length; i += tamanho) await fn(itens.slice(i, i + tamanho));
}
async function iniciar(fonte: string, url: string) {
  const db = await admin();
  const { data, error } = await db.from("coletas").insert({ fonte, url, status: "executando" }).select("id").single();
  if (error) throw error;
  return data.id;
}
async function terminar(id: number, status: "sucesso" | "erro", registros: number, hash_sha256: string | null, mensagem?: string) {
  const db = await admin();
  const { error } = await db.from("coletas").update({ status, registros, hash_sha256, mensagem: mensagem?.slice(0, 1000) ?? null, concluido_em: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function sincronizarParlamentares() {
  const uDep = `${CAMARA}/deputados?itens=1000&ordem=ASC&ordenarPor=nome`;
  const uSen = `${SENADO}/senador/lista/atual.json`;
  const coleta = await iniciar("Parlamentares em exercício — Câmara e Senado", `${uDep} | ${uSen}`);
  try {
    const [rd, rs] = await Promise.all([texto(uDep), texto(uSen)]);
    const dep = JSON.parse(rd), sen = JSON.parse(rs);
    const lista: { casa: string; id: string; nome: string; partido: string; uf: string; foto: string; atualizado_em: string }[] = [];
    for (const d of dep.dados) lista.push({ casa: "camara", id: String(d.id), nome: d.nome, partido: d.siglaPartido, uf: d.siglaUf, foto: d.urlFoto, atualizado_em: new Date().toISOString() });
    for (const p of sen.ListaParlamentarEmExercicio.Parlamentares.Parlamentar) {
      const i = p.IdentificacaoParlamentar;
      lista.push({ casa: "senado", id: String(i.CodigoParlamentar), nome: i.NomeParlamentar, partido: i.SiglaPartidoParlamentar ?? "—", uf: i.UfParlamentar ?? "—", foto: String(i.UrlFotoParlamentar ?? "").replace("http://", "https://"), atualizado_em: new Date().toISOString() });
    }
    const db = await admin();
    await emLotes(lista, 300, async (lote) => {
      const { error } = await db.from("parlamentares").upsert(lote);
      if (error) throw error;
    });
    const h = hash(rd + rs);
    await terminar(coleta, "sucesso", lista.length, h);
    return { etapa: "parlamentares", registros: lista.length, hash: h };
  } catch (e) {
    await terminar(coleta, "erro", 0, null, erro(e));
    throw e;
  }
}

async function gravarDespesas(db: Admin, despesas: Despesa[], coleta: number) {
  await emLotes(despesas, 500, async (lote) => {
    const { error } = await db.from("despesas").upsert(lote.map((d) => ({ ...d, coleta_id: coleta })));
    if (error) throw error;
  });
  const fornecedores = [...new Map(despesas.filter((d) => d.cnpj_cpf).map((d) => [`${d.casa}:${d.cnpj_cpf}`, { casa: d.casa, cnpj_cpf: d.cnpj_cpf, nome: d.fornecedor, atualizado_em: new Date().toISOString() }])).values()];
  await emLotes(fornecedores, 500, async (lote) => {
    const { error } = await db.from("fornecedores").upsert(lote);
    if (error) throw error;
  });
}

function campos(linha: string) {
  return linha.split('";"').map((c, i, a) => (i === 0 ? c.replace(/^\uFEFF?"/, "") : i === a.length - 1 ? c.replace(/"\r?$/, "") : c));
}

export async function sincronizarCeap(ano: number) {
  const url = urlArquivoCeap(ano);
  const coleta = await iniciar(`Câmara — CEAP ${ano}`, url);
  let total = 0;
  try {
    const r = await fetch(url);
    if (!r.ok || !r.body) throw new Error(`Arquivo respondeu ${r.status}`);
    const db = await admin();
    const resumo = createHash("sha256");
    let cab: string[] | null = null, resto = "", ordem = 0;
    let lote: Despesa[] = [];
    const dec = new TextDecoder();
    const descarregar = async () => { if (lote.length) { await gravarDespesas(db, lote, coleta); total += lote.length; lote = []; } };
    let processa: (txt: string, fim: boolean) => Promise<void>;
    processa = async (txt, fim) => {
      const linhas = (resto + txt).split("\n");
      resto = fim ? "" : linhas.pop() ?? "";
      for (const l of linhas) {
        if (!l) continue;
        if (!cab) { cab = campos(l); continue; }
        const v = campos(l), g = (n: string) => v[cab!.indexOf(n)] ?? "";
        const id = g("ideCadastro");
        if (!/^\d+$/.test(id)) continue;
        const base = {
          casa: "camara" as const, parlamentar_id: id, ano: Number(g("numAno")) || ano, mes: Number(g("numMes")),
          data: g("datEmissao").slice(0, 10), categoria: g("txtDescricao"), fornecedor: g("txtFornecedor"),
          cnpj_cpf: g("txtCNPJCPF"), valor: Number(g("vlrLiquido").replace(",", ".")) || 0, documento_url: g("urlDocumento") || null,
        };
        if (!base.fornecedor || base.mes < 1 || base.mes > 12) continue;
        lote.push({ ...base, linha_hash: hash([base, g("ideDocumento"), g("numDocumento"), ordem++]) });
        if (lote.length >= 500) await descarregar();
      }
    };
    await new Promise<void>((resolve, reject) => {
      let cadeia = Promise.resolve();
      const uz = new Unzip((f) => {
        f.ondata = (err, chunk, final) => {
          if (err) return reject(err);
          cadeia = cadeia.then(() => processa(dec.decode(chunk, { stream: !final }), final)).then(() => descarregar());
          if (final) cadeia.then(() => resolve()).catch(reject);
        };
        f.start();
      });
      uz.register(UnzipInflate);
      (async () => {
        const rd = r.body!.getReader();
        for (;;) {
          const { done, value } = await rd.read();
          if (done) { uz.push(new Uint8Array(0), true); break; }
          resumo.update(value); uz.push(value);
        }
      })().catch(reject);
    });
    await descarregar();
    // Só substitui o ano depois de uma coleta completa e válida.
    const { error: limpeza } = await db.from("despesas").delete().eq("casa", "camara").eq("ano", ano).neq("coleta_id", coleta);
    if (limpeza) throw limpeza;
    const h = resumo.digest("hex");
    await terminar(coleta, "sucesso", total, h);
    return { etapa: `ceap-${ano}`, registros: total, hash: h };
  } catch (e) {
    await terminar(coleta, "erro", total, null, erro(e));
    throw e;
  }
}

export async function sincronizarCeaps(ano: number) {
  const url = `${CEAPS}/${ano}`;
  const coleta = await iniciar(`Senado — CEAPS ${ano}`, url);
  try {
    const bruto = await texto(url);
    const dados = JSON.parse(bruto) as any[];
    const despesas: Despesa[] = dados.map((x, ordem) => {
      const base = {
        casa: "senado" as const, parlamentar_id: String(x.codSenador), ano: Number(x.ano), mes: Number(x.mes),
        data: String(x.data ?? "").slice(0, 10), categoria: String(x.tipoDespesa ?? ""), fornecedor: String(x.fornecedor ?? ""),
        cnpj_cpf: String(x.cpfCnpj ?? ""), valor: Number(x.valorReembolsado) || 0, documento_url: null,
      };
      return { ...base, linha_hash: hash([base, ordem]) };
    }).filter((d) => d.parlamentar_id && d.fornecedor && d.mes >= 1 && d.mes <= 12);
    const db = await admin();
    await gravarDespesas(db, despesas, coleta);
    const { error: limpeza } = await db.from("despesas").delete().eq("casa", "senado").eq("ano", ano).neq("coleta_id", coleta);
    if (limpeza) throw limpeza;
    const h = createHash("sha256").update(bruto).digest("hex");
    await terminar(coleta, "sucesso", despesas.length, h);
    return { etapa: `ceaps-${ano}`, registros: despesas.length, hash: h };
  } catch (e) {
    await terminar(coleta, "erro", 0, null, erro(e));
    throw e;
  }
}

export async function sincronizarDiario() {
  const ano = new Date().getFullYear();
  // Sequencial: respeita o limite de conexões e mantém a última coleta válida se uma fonte falhar.
  const resultados = [];
  resultados.push(await sincronizarParlamentares());
  resultados.push(await sincronizarCeap(ano));
  resultados.push(await sincronizarCeaps(ano));
  return resultados;
}
