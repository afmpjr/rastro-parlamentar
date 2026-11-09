import { createServerFn } from "@tanstack/react-start";

const CAMARA = "https://dadosabertos.camara.leg.br/api/v2";
const SENADO = "https://legis.senado.leg.br/dadosabertos";

export type Fonte = { orgao: string; url: string; coletadoEm: string };
export type Parlamentar = {
  id: string; casa: "camara" | "senado"; nome: string; partido: string; uf: string; foto: string;
};

async function getJson(url: string) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`Fonte respondeu ${r.status}`);
  return r.json() as Promise<any>;
}
const fonte = (orgao: string, url: string): Fonte => ({ orgao, url, coletadoEm: new Date().toISOString() });

export const listarParlamentares = createServerFn({ method: "GET" }).handler(async () => {
  const uDep = `${CAMARA}/deputados?itens=1000&ordem=ASC&ordenarPor=nome`;
  const uSen = `${SENADO}/senador/lista/atual.json`;
  const [dep, sen] = await Promise.allSettled([getJson(uDep), getJson(uSen)]);
  const lista: Parlamentar[] = [];
  const erros: string[] = [];
  if (dep.status === "fulfilled")
    for (const d of dep.value.dados) lista.push({ id: String(d.id), casa: "camara", nome: d.nome, partido: d.siglaPartido, uf: d.siglaUf, foto: d.urlFoto });
  else erros.push("Câmara indisponível");
  if (sen.status === "fulfilled")
    for (const p of sen.value.ListaParlamentarEmExercicio.Parlamentares.Parlamentar) {
      const i = p.IdentificacaoParlamentar;
      lista.push({ id: i.CodigoParlamentar, casa: "senado", nome: i.NomeParlamentar, partido: i.SiglaPartidoParlamentar ?? "—", uf: i.UfParlamentar ?? "—", foto: (i.UrlFotoParlamentar ?? "").replace("http://", "https://") });
    }
  else erros.push("Senado indisponível");
  lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return { lista, erros, fontes: [fonte("Câmara dos Deputados — Dados Abertos", uDep), fonte("Senado Federal — Dados Abertos", uSen)] };
});

export const detalheDeputado = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => {
    if (!/^\d{1,9}$/.test(d.id)) throw new Error("id inválido");
    return d;
  })
  .handler(async ({ data }) => {
    const uDet = `${CAMARA}/deputados/${data.id}`;
    const ano = new Date().getFullYear();
    const uProp = `${CAMARA}/proposicoes?idDeputadoAutor=${data.id}&itens=100&ordem=DESC&ordenarPor=id`;
    const hoje = new Date().toISOString().slice(0, 10);
    const umAno = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
    const uEv = `${CAMARA}/deputados/${data.id}/eventos?dataInicio=${umAno}&dataFim=${hoje}&itens=100&ordem=ASC&ordenarPor=dataHoraInicio`;
    const det = await getJson(uDet);
    const { despesasDoArquivo, urlArquivoCeap } = await import("./ceap.server");
    const eventos = async () => {
      const out: { data: string; tipo: string }[] = [];
      for (let pg = 1; pg <= 8; pg++) {
        const r = await getJson(`${uEv}&pagina=${pg}`);
        for (const e of r.dados) out.push({ data: String(e.dataHoraInicio ?? "").slice(0, 10), tipo: e.descricaoTipo ?? "" });
        if (!r.links?.some((l: any) => l.rel === "next")) break;
      }
      return out;
    };
    const [prop, ev, d0, d1] = await Promise.allSettled([getJson(uProp), eventos(), despesasDoArquivo(ano, data.id), despesasDoArquivo(ano - 1, data.id)]);
    const s = det.dados.ultimoStatus;
    type Prop = { id: number; sigla: string; tipo: string; ementa: string; data: string };
    const despesas = [d0, d1].flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    for (const r of [d0, d1]) if (r.status === "rejected") console.error("CEAP arquivo", r.reason);
    const proposicoes: Prop[] = prop.status === "fulfilled"
      ? prop.value.dados.map((p: any) => ({ id: p.id, sigla: `${p.siglaTipo} ${p.numero}/${p.ano}`, tipo: p.siglaTipo, ementa: p.ementa, data: p.dataApresentacao ?? String(p.ano) }))
      : [];
    return {
      perfil: {
        nome: s.nomeEleitoral, nomeCivil: det.dados.nomeCivil, partido: s.siglaPartido, uf: s.siglaUf,
        foto: s.urlFoto, situacao: s.situacao, email: s.gabinete?.email ?? null,
        nascimento: det.dados.dataNascimento, municipioNascimento: det.dados.municipioNascimento,
        escolaridade: det.dados.escolaridade, legislatura: s.idLegislatura,
      },
      despesas,
      despesasArquivo: urlArquivoCeap(ano),
      proposicoes,
      eventos: ev.status === "fulfilled" ? ev.value : [],
      fontes: [fonte("Câmara — perfil", uDet), fonte(`Câmara — arquivo anual CEAP ${ano}`, urlArquivoCeap(ano)), fonte(`Câmara — arquivo anual CEAP ${ano - 1}`, urlArquivoCeap(ano - 1)), fonte("Câmara — proposições", uProp), fonte("Câmara — eventos (agenda)", uEv)],
    };
  });

const CEAPS = "https://adm.senado.gov.br/adm-dadosabertos/api/v1/senadores/despesas_ceaps";
const cacheCeaps = new Map<number, { t: number; dados: any[] }>();
async function ceapsAno(ano: number) {
  const c = cacheCeaps.get(ano);
  if (c && Date.now() - c.t < 3600_000) return c.dados;
  const dados = (await getJson(`${CEAPS}/${ano}`)) as any[];
  cacheCeaps.set(ano, { t: Date.now(), dados });
  return dados;
}

export const detalheSenador = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => {
    if (!/^\d{1,9}$/.test(d.id)) throw new Error("id inválido");
    return d;
  })
  .handler(async ({ data }) => {
    const uDet = `${SENADO}/senador/${data.id}.json`;
    const uMand = `${SENADO}/senador/${data.id}/mandatos.json`;
    const det = await getJson(uDet);
    const p = det.DetalheParlamentar.Parlamentar;
    const i = p.IdentificacaoParlamentar;
    const db = p.DadosBasicosParlamentar ?? {};
    let mandatos: { inicio: string; fim: string; uf: string; participacao: string }[] = [];
    try {
      const m = await getJson(uMand);
      const arr = m.MandatoParlamentar?.Parlamentar?.Mandatos?.Mandato ?? [];
      mandatos = (Array.isArray(arr) ? arr : [arr]).map((x: any) => ({
        inicio: x.PrimeiraLegislaturaDoMandato?.DataInicio ?? "", fim: x.SegundaLegislaturaDoMandato?.DataFim ?? "",
        uf: x.UfParlamentar ?? "", participacao: x.DescricaoParticipacao ?? "",
      }));
    } catch { /* fonte opcional */ }
    const uCom = `${SENADO}/senador/${data.id}/comissoes.json`;
    const uVot = `${SENADO}/senador/${data.id}/votacoes.json`;
    const uAut = `${SENADO}/senador/${data.id}/autorias.json`;
    const arr = (x: any) => (Array.isArray(x) ? x : x ? [x] : []);
    const [rc, rv, ra] = await Promise.allSettled([getJson(uCom), getJson(uVot), getJson(uAut)]);
    const comissoes = rc.status === "fulfilled"
      ? arr(rc.value.MembroComissaoParlamentar?.Parlamentar?.MembroComissoes?.Comissao).map((c: any) => ({
          sigla: c.IdentificacaoComissao?.SiglaComissao ?? "", nome: c.IdentificacaoComissao?.NomeComissao ?? "",
          casa: c.IdentificacaoComissao?.SiglaCasaComissao ?? "", participacao: c.DescricaoParticipacao ?? "",
          inicio: c.DataInicio ?? "", fim: c.DataFim ?? null as string | null,
        })).filter((c: any) => !c.fim).sort((a: any, b: any) => b.inicio.localeCompare(a.inicio))
      : [];
    const votacoes = rv.status === "fulfilled"
      ? arr(rv.value.VotacaoParlamentar?.Parlamentar?.Votacoes?.Votacao).map((v: any) => ({
          data: v.SessaoPlenaria?.DataSessao ?? "", materia: v.Materia?.DescricaoIdentificacao ?? "",
          ementa: v.Materia?.Ementa ?? "", descricao: v.DescricaoVotacao ?? "",
          voto: v.SiglaDescricaoVoto ?? "", resultado: v.DescricaoResultado ?? "",
        })).sort((a: any, b: any) => b.data.localeCompare(a.data))
      : [];
    const autorias = ra.status === "fulfilled"
      ? arr(ra.value.MateriasAutoriaParlamentar?.Parlamentar?.Autorias?.Autoria).map((a: any) => ({
          sigla: a.Materia?.DescricaoIdentificacao ?? "", ementa: a.Materia?.Ementa ?? "",
          data: a.Materia?.Data ?? a.Materia?.DataApresentacao ?? "", codigo: a.Materia?.Codigo ?? "",
        })).sort((a: any, b: any) => String(b.data).localeCompare(String(a.data)))
      : [];
    const anoAtual = new Date().getFullYear();
    const despesas = (await Promise.allSettled([ceapsAno(anoAtual), ceapsAno(anoAtual - 1)]))
      .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .filter((x) => String(x.codSenador) === data.id)
      .map((x) => ({ data: x.data ?? "", ano: Number(x.ano), mes: Number(x.mes), tipo: x.tipoDespesa ?? "", fornecedor: x.fornecedor ?? "", cnpjCpf: x.cpfCnpj ?? "", valor: Number(x.valorReembolsado) || 0 }));
    return {
      despesas,
      comissoes: comissoes as { sigla: string; nome: string; casa: string; participacao: string; inicio: string; fim: string | null }[],
      votacoes: votacoes as { data: string; materia: string; ementa: string; descricao: string; voto: string; resultado: string }[],
      autorias: autorias as { sigla: string; ementa: string; data: string; codigo: string }[],
      perfil: {
        nome: i.NomeParlamentar, nomeCivil: i.NomeCompletoParlamentar, partido: i.SiglaPartidoParlamentar,
        uf: i.UfParlamentar, foto: (i.UrlFotoParlamentar ?? "").replace("http://", "https://"),
        email: i.EmailParlamentar ?? null, nascimento: db.DataNascimento ?? null,
        municipioNascimento: db.Naturalidade ?? null, pagina: i.UrlPaginaParlamentar,
      },
      mandatos,
      fontes: [fonte("Senado — perfil", uDet), fonte("Senado — mandatos", uMand), fonte("Senado — comissões", uCom), fonte("Senado — votações", uVot), fonte("Senado — autorias", uAut), fonte(`Senado — despesas CEAPS ${anoAtual}`, `${CEAPS}/${anoAtual}`), fonte(`Senado — despesas CEAPS ${anoAtual - 1}`, `${CEAPS}/${anoAtual - 1}`)],
    };
  });
