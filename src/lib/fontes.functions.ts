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
    const uDesp = `${CAMARA}/deputados/${data.id}/despesas?itens=100&ordem=DESC&ordenarPor=dataDocumento`;
    const uProp = `${CAMARA}/proposicoes?idDeputadoAutor=${data.id}&itens=15&ordem=DESC&ordenarPor=id`;
    const det = await getJson(uDet);
    const [desp, prop] = await Promise.allSettled([getJson(uDesp), getJson(uProp)]);
    const s = det.dados.ultimoStatus;
    type Desp = { ano: number; mes: number; tipo: string; fornecedor: string; cnpjCpf: string; valor: number; doc: string | null };
    type Prop = { id: number; sigla: string; ementa: string; data: string };
    const despesas: Desp[] = desp.status === "fulfilled"
      ? desp.value.dados.map((x: any) => ({
          ano: x.ano, mes: x.mes, tipo: x.tipoDespesa, fornecedor: x.nomeFornecedor,
          cnpjCpf: x.cnpjCpfFornecedor, valor: Number(x.valorLiquido) || 0, doc: x.urlDocumento ?? null,
        }))
      : [];
    return {
      perfil: {
        nome: s.nomeEleitoral, nomeCivil: det.dados.nomeCivil, partido: s.siglaPartido, uf: s.siglaUf,
        foto: s.urlFoto, situacao: s.situacao, email: s.gabinete?.email ?? null,
        nascimento: det.dados.dataNascimento, municipioNascimento: det.dados.municipioNascimento,
        escolaridade: det.dados.escolaridade, legislatura: s.idLegislatura,
      },
      despesas,
      despesasArquivo: `https://www.camara.leg.br/cotas/Ano-${ano}.csv.zip`,
      proposicoes: (prop.status === "fulfilled"
        ? prop.value.dados.map((p: any) => ({ id: p.id, sigla: `${p.siglaTipo} ${p.numero}/${p.ano}`, ementa: p.ementa, data: p.dataApresentacao }))
        : []) as Prop[],
      fontes: [fonte("Câmara — perfil", uDet), fonte("Câmara — despesas CEAP", uDesp), fonte("Câmara — proposições", uProp)],
    };
  });

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
    return {
      perfil: {
        nome: i.NomeParlamentar, nomeCivil: i.NomeCompletoParlamentar, partido: i.SiglaPartidoParlamentar,
        uf: i.UfParlamentar, foto: (i.UrlFotoParlamentar ?? "").replace("http://", "https://"),
        email: i.EmailParlamentar ?? null, nascimento: db.DataNascimento ?? null,
        municipioNascimento: db.Naturalidade ?? null, pagina: i.UrlPaginaParlamentar,
      },
      mandatos,
      fontes: [fonte("Senado — perfil", uDet), fonte("Senado — mandatos", uMand)],
    };
  });
