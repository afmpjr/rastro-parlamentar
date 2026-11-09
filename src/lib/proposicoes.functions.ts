import { createServerFn } from "@tanstack/react-start";
import type { Fonte } from "./fontes.functions";

const CAMARA = "https://dadosabertos.camara.leg.br/api/v2";
const SENADO = "https://legis.senado.leg.br/dadosabertos";
async function getJson(url: string) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`Fonte respondeu ${r.status}`);
  return r.json() as Promise<any>;
}
const fonte = (orgao: string, url: string): Fonte => ({ orgao, url, coletadoEm: new Date().toISOString() });
const limpa = (s: unknown, n = 80) => String(s ?? "").replace(/[^\p{L}\p{N} .,\-/]/gu, "").slice(0, n).trim();
const cache = new Map<string, { t: number; v: any }>();
async function cached<T>(k: string, f: () => Promise<T>): Promise<T> {
  const c = cache.get(k);
  if (c && Date.now() - c.t < 3600_000) return c.v;
  const v = await f();
  cache.set(k, { t: Date.now(), v });
  if (cache.size > 200) cache.delete(cache.keys().next().value!);
  return v;
}

export type ItemBusca = { casa: "camara" | "senado"; id: string; identificacao: string; ementa: string; data: string; autoria: string; situacao: string };
export type Busca = { casa: string; q: string; tipo: string; numero: string; ano: string; autor: string; tema: string; tramitando: string; pagina: number };

export const temasCamara = createServerFn({ method: "GET" }).handler(async () =>
  cached("temas", async () => (await getJson(`${CAMARA}/referencias/proposicoes/codTema`)).dados.map((t: any) => ({ cod: String(t.cod), nome: String(t.nome) })) as { cod: string; nome: string }[]));

export const buscarProposicoes = createServerFn({ method: "GET" })
  .inputValidator((d: Busca) => ({
    casa: d.casa === "senado" ? "senado" : "camara", q: limpa(d.q), tipo: limpa(d.tipo, 6).toUpperCase(), numero: limpa(d.numero, 6).replace(/\D/g, ""),
    ano: limpa(d.ano, 4).replace(/\D/g, ""), autor: limpa(d.autor, 60), tema: limpa(d.tema, 4).replace(/\D/g, ""), tramitando: d.tramitando === "S" || d.tramitando === "N" ? d.tramitando : "",
    pagina: Math.max(1, Math.min(200, Math.floor(Number(d.pagina) || 1))),
  }))
  .handler(async ({ data: b }) => {
    const POR = 20;
    if (b.casa === "camara") {
      const p = new URLSearchParams({ itens: String(POR), pagina: String(b.pagina), ordem: "DESC", ordenarPor: "id" });
      if (b.q) p.set("keywords", b.q);
      if (b.tipo) p.set("siglaTipo", b.tipo);
      if (b.numero) p.set("numero", b.numero);
      if (b.ano) p.set("ano", b.ano);
      if (b.autor) p.set("autor", b.autor);
      if (b.tema) p.set("codTema", b.tema);
      if (!b.ano && !b.numero) p.set("dataApresentacaoInicio", "2003-01-01");
      const url = `${CAMARA}/proposicoes?${p}`;
      try {
        const r = await getJson(url);
        const itens: ItemBusca[] = r.dados.map((x: any) => ({ casa: "camara", id: String(x.id), identificacao: `${x.siglaTipo} ${x.numero}/${x.ano}`, ementa: x.ementa ?? "", data: String(x.dataApresentacao ?? "").slice(0, 10), autoria: "", situacao: "" }));
        const temMais = !!r.links?.some((l: any) => l.rel === "next");
        return { itens, total: null as number | null, temMais, erro: "", fontes: [fonte("Câmara dos Deputados — Dados Abertos", url)] };
      } catch { return { itens: [] as ItemBusca[], total: null, temMais: false, erro: "A Câmara não respondeu. Tente de novo ou com menos filtros.", fontes: [fonte("Câmara dos Deputados — Dados Abertos", url)] }; }
    }
    const p = new URLSearchParams();
    if (b.q) p.set("termo", b.q);
    if (b.tipo) p.set("sigla", b.tipo);
    if (b.numero) p.set("numero", b.numero);
    if (b.ano) p.set("ano", b.ano);
    if (b.autor) p.set("nomeAutor", b.autor);
    if (b.tramitando) p.set("tramitando", b.tramitando);
    if (![...p.keys()].length) p.set("ano", String(new Date().getFullYear()));
    const url = `${SENADO}/processo?${p}`;
    try {
      const r: any[] = await cached(url, () => getJson(url));
      r.sort((a, c) => String(c.dataApresentacao).localeCompare(String(a.dataApresentacao)));
      const itens: ItemBusca[] = r.slice((b.pagina - 1) * POR, b.pagina * POR).map((x) => ({ casa: "senado", id: String(x.id), identificacao: x.identificacao, ementa: x.ementa ?? "", data: String(x.dataApresentacao ?? "").slice(0, 10), autoria: x.autoria ?? "", situacao: x.situacaoAtual ?? "" }));
      return { itens, total: r.length as number | null, temMais: b.pagina * POR < r.length, erro: "", fontes: [fonte("Senado Federal — Dados Abertos", url)] };
    } catch { return { itens: [] as ItemBusca[], total: null, temMais: false, erro: "O Senado não respondeu. Tente com mais filtros (ex.: ano).", fontes: [fonte("Senado Federal — Dados Abertos", url)] }; }
  });

export type Pessoa = { nome: string; papel: string; partido: string; uf: string; casa: "camara" | "senado" | ""; id: string };
export type Passo = { data: string; orgao: string; descricao: string; situacao: string; url: string };
export type Votacao = { id: string; data: string; orgao: string; descricao: string; resultado: string; sim: number | null; nao: number | null; abst: number | null; votosInline: { nome: string; partido: string; uf: string; voto: string; id: string }[] | null };
export type Detalhe = {
  casa: "camara" | "senado"; id: string; identificacao: string; tipo: string; ementa: string; resumo: string; palavras: string;
  apresentacao: string; situacao: string; dataSituacao: string; regime: string; norma: string; temas: string[];
  autores: Pessoa[]; relatores: (Pessoa & { orgao: string; desde: string; ate: string })[];
  pareceres: Passo[]; tramitacao: Passo[]; votacoes: Votacao[]; documentos: { titulo: string; data: string; url: string }[];
  linkOficial: string; inteiroTeor: string; fontes: Fonte[]; avisos: string[];
};

const idDe = (uri: string | null | undefined) => String(uri ?? "").split("/").pop() ?? "";

export const detalheProposicao = createServerFn({ method: "GET" })
  .inputValidator((d: { casa: string; id: string }) => {
    if (!/^\d{1,10}$/.test(d.id) || !["camara", "senado"].includes(d.casa)) throw new Error("parâmetros inválidos");
    return d as { casa: "camara" | "senado"; id: string };
  })
  .handler(async ({ data }): Promise<Detalhe> => cached(`det:${data.casa}:${data.id}`, () => data.casa === "camara" ? camara(data.id) : senado(data.id)));

async function camara(id: string): Promise<Detalhe> {
  const u = `${CAMARA}/proposicoes/${id}`;
  const [d, a, t, v, tm] = await Promise.allSettled([getJson(u), getJson(`${u}/autores`), getJson(`${u}/tramitacoes`), getJson(`${u}/votacoes`), getJson(`${u}/temas`)]);
  if (d.status !== "fulfilled") throw new Error("Proposição não encontrada na Câmara");
  const x = d.value.dados; const st = x.statusProposicao ?? {};
  const avisos: string[] = [];
  const autores: Pessoa[] = a.status === "fulfilled" ? a.value.dados.map((p: any) => ({ nome: p.nome, papel: p.proponente ? "Autor(a)" : "Coautor(a)", partido: "", uf: "", casa: p.uri?.includes("/deputados/") ? "camara" : "", id: p.uri?.includes("/deputados/") ? idDe(p.uri) : "" })) : (avisos.push("Autores indisponíveis"), []);
  const tram: Passo[] = t.status === "fulfilled" ? t.value.dados.map((p: any) => ({ data: String(p.dataHora ?? "").slice(0, 10), orgao: p.siglaOrgao ?? "", descricao: [p.descricaoTramitacao, p.despacho].filter(Boolean).join(" — "), situacao: p.descricaoSituacao ?? "", url: p.url ?? "" })).reverse() : (avisos.push("Tramitação indisponível"), []);
  const relatores: Detalhe["relatores"] = [];
  const re = /Designad[oa] Relator[a]?,?\s*(?:Dep\.|Deputad[oa])?\s*([^()]+?)\s*\(([^/]+)\/(\w{2})\)/i;
  for (const p of [...tram].reverse()) {
    const m = p.descricao.match(re);
    if (m) relatores.push({ nome: (m[1] ?? "").trim(), papel: "Relator(a)", partido: m[2] ?? "", uf: m[3] ?? "", casa: "", id: "", orgao: p.orgao, desde: p.data, ate: "" });
  }
  if (st.uriUltimoRelator) {
    try { const r = (await getJson(st.uriUltimoRelator)).dados; const ult = r.ultimoStatus ?? {};
      const nome = ult.nome ?? r.nomeCivil; const ja = relatores.find((p) => p.nome.toLowerCase() === String(nome).toLowerCase());
      if (ja) { ja.id = String(r.id); ja.casa = "camara"; ja.papel = "Relator(a) atual"; } else relatores.push({ nome, papel: "Relator(a) atual", partido: ult.siglaPartido ?? "", uf: ult.siglaUf ?? "", casa: "camara", id: String(r.id), orgao: st.siglaOrgao ?? "", desde: "", ate: "" });
    } catch { /* opcional */ }
  }
  const pareceres = tram.filter((p) => /parecer/i.test(p.descricao));
  const votacoes: Votacao[] = v.status === "fulfilled" ? v.value.dados.map((z: any) => ({ id: z.id, data: z.data, orgao: z.siglaOrgao, descricao: z.descricao, resultado: z.aprovacao === 1 ? "Aprovada" : z.aprovacao === 0 ? "Rejeitada" : "", sim: null, nao: null, abst: null, votosInline: null })) : [];
  return {
    casa: "camara", id, identificacao: `${x.siglaTipo} ${x.numero}/${x.ano}`, tipo: x.descricaoTipo ?? x.siglaTipo, ementa: x.ementa ?? "", resumo: x.ementaDetalhada ?? "", palavras: x.keywords ?? "",
    apresentacao: String(x.dataApresentacao ?? "").slice(0, 10), situacao: st.descricaoSituacao ?? "", dataSituacao: String(st.dataHora ?? "").slice(0, 10), regime: st.regime ?? "", norma: "",
    temas: tm.status === "fulfilled" ? tm.value.dados.map((q: any) => q.tema) : [],
    autores, relatores, pareceres, tramitacao: tram, votacoes, documentos: [],
    linkOficial: `https://www.camara.leg.br/propostas-legislativas/${id}`, inteiroTeor: x.urlInteiroTeor ?? "",
    fontes: [fonte("Câmara — proposição", u), fonte("Câmara — autores", `${u}/autores`), fonte("Câmara — tramitações", `${u}/tramitacoes`), fonte("Câmara — votações", `${u}/votacoes`)], avisos,
  };
}

async function senado(id: string): Promise<Detalhe> {
  const u = `${SENADO}/processo/${id}`, ur = `${SENADO}/processo/relatoria?idProcesso=${id}`, uv = `${SENADO}/votacao?idProcesso=${id}`, ud = `${SENADO}/processo/documento?idProcesso=${id}`;
  const [d, r, v, dc] = await Promise.allSettled([getJson(u), getJson(ur), getJson(uv), getJson(ud)]);
  if (d.status !== "fulfilled") throw new Error("Processo não encontrado no Senado");
  const x = d.value; const avisos: string[] = [];
  const tram: Passo[] = [];
  for (const au of x.autuacoes ?? []) for (const s of au.situacoes ?? []) tram.push({ data: String(s.inicio ?? ""), orgao: s.colegiado?.sigla ?? "", descricao: s.descricao ?? "", situacao: "", url: "" });
  for (const de of x.despachos ?? []) tram.push({ data: String(de.data ?? ""), orgao: "", descricao: `${de.tipoMotivacao ?? "Despacho"}: ${(de.providencias ?? []).map((p: any) => [p.descricao, ...(p.unidadesDestinatarias ?? []).map((q: any) => q.colegiado?.sigla ?? q.sigla ?? "")].filter(Boolean).join(" ")).join("; ")}`, situacao: "", url: "" });
  tram.sort((a, b) => b.data.localeCompare(a.data));
  const docs = dc.status === "fulfilled" && Array.isArray(dc.value) ? dc.value : [];
  return {
    casa: "senado", id, identificacao: x.identificacao, tipo: x.descricaoSigla ?? x.sigla, ementa: x.conteudo?.ementa ?? "", resumo: x.conteudo?.explicacao ?? "", palavras: String(x.documento?.indexacao ?? "").replace(/\s+,\s+/g, ", ").replace(/\s*\.\s*$/, "").trim(),
    apresentacao: x.documento?.dataApresentacao ?? x.dataInicioEfetivo ?? "", situacao: x.situacaoAtual ?? "", dataSituacao: x.dataSituacaoAtual ?? "", regime: "", norma: x.normaGerada?.descricao ?? "",
    temas: (x.classificacoes ?? []).map((c: any) => c.descricaoHierarquia ?? c.descricao),
    autores: (x.autoriaIniciativa ?? []).map((p: any) => ({ nome: p.autor, papel: p.ordem === 1 ? "Autor(a)" : "Coautor(a)", partido: p.siglaPartido ?? "", uf: p.uf ?? "", casa: p.codigoParlamentar && p.siglaEnte === "SF" ? "senado" : "", id: p.codigoParlamentar ? String(p.codigoParlamentar) : "" })),
    relatores: r.status === "fulfilled" && Array.isArray(r.value) ? r.value.map((p: any) => ({ nome: p.nomeParlamentar, papel: p.descricaoTipoRelator ?? "Relator", partido: p.siglaPartidoParlamentar ?? "", uf: p.ufParlamentar ?? "", casa: p.casaRelator === "SF" ? "senado" : "", id: String(p.codigoParlamentar ?? ""), orgao: p.siglaColegiado ?? "", desde: String(p.dataDesignacao ?? "").slice(0, 10), ate: String(p.dataDestituicao ?? "").slice(0, 10) })) : (avisos.push("Relatorias indisponíveis"), []),
    pareceres: docs.filter((q: any) => /parecer|relat/i.test(`${q.descricaoTipo ?? ""} ${q.descricao ?? ""}`)).map((q: any) => ({ data: String(q.dataDocumento ?? "").slice(0, 10), orgao: q.siglaColegiadoRecebedor ?? "", descricao: [q.identificacao, q.descricao].filter(Boolean).join(" — "), situacao: q.autoria ?? "", url: q.urlDocumento ?? "" })),
    tramitacao: tram,
    votacoes: v.status === "fulfilled" && Array.isArray(v.value) ? v.value.map((z: any) => ({ id: String(z.codigoSessaoVotacao), data: z.dataSessao, orgao: z.informeLegislativo?.siglaColegiado ?? "PLEN", descricao: z.descricaoVotacao ?? "", resultado: z.resultadoVotacao === "A" ? "Aprovada" : z.resultadoVotacao === "R" ? "Rejeitada" : z.resultadoVotacao ?? "", sim: z.totalVotosSim ?? null, nao: z.totalVotosNao ?? null, abst: z.totalVotosAbstencao ?? null, votosInline: (z.votos ?? []).map((q: any) => ({ nome: q.nomeParlamentar, partido: q.siglaPartidoParlamentar, uf: q.siglaUFParlamentar, voto: q.siglaVotoParlamentar ?? "", id: String(q.codigoParlamentar) })) })) : [],
    documentos: docs.slice(0, 40).map((q: any) => ({ titulo: [q.descricaoTipo, q.identificacao, q.descricao].filter(Boolean).join(" — ") || "Documento", data: String(q.dataDocumento ?? "").slice(0, 10), url: q.urlDocumento ?? "" })).filter((q: any) => q.url),
    linkOficial: `https://www25.senado.leg.br/web/atividade/materias/-/materia/${x.codigoMateria}`, inteiroTeor: x.documento?.url ?? "",
    fontes: [fonte("Senado — processo", u), fonte("Senado — relatorias", ur), fonte("Senado — votações", uv), fonte("Senado — documentos", ud)], avisos,
  };
}

export const votosCamara = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => { if (!/^\d{1,10}-\d{1,5}$/.test(d.id)) throw new Error("id inválido"); return d; })
  .handler(async ({ data }) => {
    const url = `${CAMARA}/votacoes/${data.id}/votos`;
    const r = await cached(url, () => getJson(url));
    return { votos: r.dados.map((q: any) => ({ nome: q.deputado_.nome, partido: q.deputado_.siglaPartido, uf: q.deputado_.siglaUf, voto: q.tipoVoto, id: String(q.deputado_.id) })) as { nome: string; partido: string; uf: string; voto: string; id: string }[], fonte: fonte("Câmara — votos", url) };
  });
