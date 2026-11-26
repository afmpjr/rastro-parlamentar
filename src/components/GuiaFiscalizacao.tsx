import { useState } from "react";
import { ArrowUpRight, Copy, Check, Info, Landmark, Search, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/ufs";
import { execucaoEmendas, pedidoEmendas } from "@/lib/execucao-emendas";

export function BarraPagamento({ empenhado, pago }: { empenhado: number; pago: number }) {
  const r = execucaoEmendas(empenhado, pago);
  const percentual = r.percentual?.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return <div className="mt-2">
    <div role="progressbar" aria-label="Percentual pago em relação ao empenhado" aria-valuemin={0} aria-valuemax={100} aria-valuenow={r.barra} aria-valuetext={percentual ? `${percentual}% pago` : "Sem base para calcular"} className="h-3 overflow-hidden rounded-sm bg-secondary">
      <div className="h-full bg-primary" style={{ width: `${r.barra}%` }} />
    </div>
    <p className="mt-1 text-sm">{r.percentual === null ? "Sem base para calcular a proporção paga." : `${percentual}% pago do valor empenhado`}{r.situacao === "acima" ? " · Pagamento acima do empenho neste recorte; consulte os registros oficiais." : ""}</p>
  </div>;
}

export function ResumoDinheiro({ empenhado, pago, qtd }: { empenhado: number; pago: number; qtd: number }) {
  const r = execucaoEmendas(empenhado, pago);
  return <section className="mt-6" aria-label="Resumo do dinheiro">
    <p className="mb-3 text-sm text-muted-foreground">{qtd.toLocaleString("pt-BR")} emendas no recorte selecionado · Valores agregados</p>
    <div className="grid gap-3 sm:grid-cols-3">
      {[["Reservado (empenhado)", empenhado], ["Pagamentos registrados", pago], ["Diferença entre reservado e pago", r.diferenca]].map(([rotulo, valor]) => <div key={String(rotulo)} className="min-w-0 border border-border p-4"><p className="text-sm text-muted-foreground">{rotulo}</p><p className="mt-1 break-words font-display text-2xl font-bold">{brl(Number(valor))}</p></div>)}
    </div>
    <BarraPagamento empenhado={empenhado} pago={pago} />
    <p className="mt-3 flex items-start gap-2 border-l-4 border-highlight bg-secondary p-3 text-sm leading-relaxed"><Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />Pagamento federal não comprova obra concluída, dinheiro na conta da prefeitura nem aplicação final. A diferença não indica, por si só, atraso ou valor que ainda será liberado.</p>
    <details className="mt-5 border-y border-border py-4">
      <summary className="cursor-pointer text-lg font-semibold">Entenda o caminho do dinheiro</summary>
      <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Indicação", "O parlamentar ou a bancada propõe a destinação."], ["Empenho (reserva)", "O governo registra um compromisso no orçamento."], ["Liquidação (verificação)", "O órgão verifica o direito do credor a receber, conforme o instrumento."], ["Pagamento", "O governo registra a saída do recurso ao beneficiário indicado."]].map(([titulo, texto], i) => <li key={titulo}><p className="font-semibold">{i + 1}. {titulo}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{texto}</p></li>)}
      </ol>
      <p className="mt-4 text-sm text-muted-foreground">Este resumo mostra empenho e pagamento, não o andamento individual das outras etapas. O motivo de uma diferença precisa ser consultado no registro ou solicitado ao órgão responsável.</p>
    </details>
  </section>;
}

export function GuiaFiscalizacao(props: { municipio: string; uf: string; autor: string; ano: number; empenhado: number; pago: number }) {
  const [mensagem, setMensagem] = useState("");
  const pedido = pedidoEmendas(props);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(pedido); setMensagem("Pedido copiado. Cole no canal do órgão responsável e guarde o protocolo."); }
    catch { setMensagem("Não foi possível copiar automaticamente. Selecione o texto do pedido abaixo e copie."); }
  };
  return <section className="mt-8 border-t border-border pt-6" aria-labelledby="guia-fiscalizacao">
    <h2 id="guia-fiscalizacao" className="font-display text-2xl font-bold">Como acompanhar e cobrar{props.municipio ? ` em ${props.municipio}` : ""}</h2>
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="text-lg font-semibold">Essa verba virou obra ou serviço?</h3>
        <p className="mt-2 leading-relaxed">Uma emenda pode financiar obras, equipamentos ou manutenção de serviços, como medicamentos. A área “Saúde” ou “Educação” não permite identificar o objeto nem confirmar a execução.</p>
        <p className="mt-3 leading-relaxed text-muted-foreground">Este resumo não informa beneficiário/CNPJ, número individual da emenda, contrato ou endereço de obra. Peça esses dados antes de procurar a entrega na sua cidade.</p>
        <h3 className="mt-5 text-lg font-semibold">Quem pode esclarecer?</h3>
        <ul className="mt-2 space-y-3 leading-relaxed">
          <li><strong>Sobre valores não pagos:</strong> peça ao órgão federal responsável a situação e o motivo documentado; o gabinete pode esclarecer a indicação. Não há garantia de liberação.</li>
          <li><strong>Sobre valores pagos:</strong> identifique primeiro o beneficiário. Se for a prefeitura, procure a secretaria responsável e seu portal de transparência; os vereadores podem fiscalizar. O destinatário também pode ser outro ente ou instituição.</li>
        </ul>
      </div>
      <div>
        <ol className="space-y-4">
          {[
            { icon: Search, titulo: "1. Conferir os registros de pagamento", texto: "Busque por município, autor e ano; confira beneficiário e identificadores.", url: "https://portaldatransparencia.gov.br/emendas/consulta", link: "Portal da Transparência" },
            { icon: Landmark, titulo: "2. Procurar destinação e execução", texto: "Consulte o portal do beneficiário. No Transferegov, procure pelo município ou CNPJ quando houver instrumento nessa plataforma.", url: "https://www.gov.br/transferegov/pt-br", link: "Transferegov" },
            { icon: MessageSquare, titulo: "3. Pedir informações e documentos", texto: "Use o Fala.BR para órgãos federais ou entes aderentes; para outros, procure o e-SIC/ouvidoria local. Cobrança ao gabinete não substitui pedido de LAI.", url: "https://falabr.cgu.gov.br/", link: "Fala.BR — acesso à informação" },
            { icon: ShieldCheck, titulo: "4. Relatar uma suspeita fundamentada", texto: "Anexe documentos e identificadores. Valor não pago, isoladamente, não comprova irregularidade. Verifique a competência do órgão de controle.", url: "https://www.mpf.mp.br/mpfservicos", link: "Serviços ao cidadão — MPF" },
          ].map((item) => <li key={item.titulo} className="flex gap-3"><item.icon className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden /><div className="min-w-0"><h3 className="font-semibold">{item.titulo}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.texto}</p><a className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary underline" href={item.url} target="_blank" rel="noreferrer">{item.link}<ArrowUpRight className="h-4 w-4" aria-hidden /><span className="sr-only"> (abre em nova aba)</span></a></div></li>)}
        </ol>
      </div>
    </div>
    <div className="mt-6 border-t border-border pt-4">
      <Button onClick={copiar} className="h-auto min-h-11 whitespace-normal text-left">{mensagem.startsWith("Pedido copiado") ? <Check aria-hidden /> : <Copy aria-hidden />}Copiar pedido de informação (LAI)</Button>
      <p role="status" className="mt-2 text-sm">{mensagem}</p>
      <details className="mt-2"><summary className="cursor-pointer font-medium text-primary">Ler e adaptar o pedido antes de enviar</summary><p className="mt-3 whitespace-pre-wrap break-words border-l-2 border-border pl-4 leading-relaxed">{pedido}</p></details>
      <p className="mt-3 text-sm text-muted-foreground">Revise o período e os filtros antes de enviar. Guarde o protocolo e acompanhe a resposta no canal utilizado.</p>
    </div>
  </section>;
}