export function execucaoEmendas(empenhado: number, pago: number) {
  const valido = Number.isFinite(empenhado) && Number.isFinite(pago) && empenhado > 0 && pago >= 0;
  const percentual = valido ? (pago / empenhado) * 100 : null;
  return {
    percentual,
    barra: percentual === null ? 0 : Math.min(100, percentual),
    diferenca: empenhado - pago,
    situacao: !valido ? "sem-base" : pago > empenhado ? "acima" : pago === empenhado ? "integral" : pago === 0 ? "sem-pagamento" : "parcial",
  };
}

export function pedidoEmendas(d: { municipio: string; uf: string; autor: string; ano: number; empenhado: number; pago: number }) {
  const periodo = d.ano === -1 ? "todos os anos disponíveis na consulta" : `o exercício ${d.ano}`;
  return `Solicito, pela Lei de Acesso à Informação, informações sobre as emendas parlamentares relacionadas a ${d.municipio || "todos os municípios do recorte"}${d.uf ? ` (${d.uf})` : ""}, para ${periodo}${d.autor ? `, com autoria filtrada por ${d.autor}` : ""}.

A consulta apresenta valores agregados de R$ ${d.empenhado.toFixed(2)} empenhados e R$ ${d.pago.toFixed(2)} pagos. Solicito a identificação das emendas e instrumentos correspondentes, os beneficiários (nome e CNPJ), as finalidades, datas e valores dos pagamentos, o órgão responsável e os documentos disponíveis sobre contratos, execução e prestação de contas. Para eventual diferença entre empenho e pagamento, solicito a situação atual e o motivo documentado, se existente.

Se este órgão não detiver as informações, solicito orientação sobre o órgão competente. Os totais consultados não comprovam obra concluída nem irregularidade. Anexe o endereço da consulta ao enviar este pedido.`;
}