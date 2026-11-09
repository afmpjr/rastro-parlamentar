import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/metodologia")({
  head: () => ({ meta: [
    { title: "Metodologia e limitações — Plenário Aberto" },
    { name: "description", content: "Fontes, critérios, limitações e lacunas conhecidas do monitor de parlamentares." },
    { property: "og:title", content: "Metodologia e limitações — Plenário Aberto" },
    { property: "og:description", content: "Como coletamos, o que mostramos e o que ainda falta." },
  ] }),
  component: Met,
});

const lacunas = [
  ["API de despesas da Câmara retornando vazio", "Alto", "Importar arquivos anuais oficiais (CSV) para banco próprio"],
  ["Despesas do Senado (CEAPS)", "Alto", "Integrar arquivos públicos do Senado"],
  ["Votações e presença por parlamentar", "Médio", "Agregar votações nominais por sessão"],
  ["Histórico/versões das coletas", "Médio", "Armazenar snapshots com hash e data"],
  ["Contratos, emendas, transferências, estados e municípios", "Fora do MVP", "Fases seguintes"],
];

function Met() {
  return (
    <article className="max-w-3xl space-y-6">
      <h1 className="text-4xl font-bold">Metodologia e limitações</h1>
      <p>Os dados vêm diretamente das APIs de Dados Abertos da Câmara dos Deputados e do Senado Federal, consultadas no momento do acesso (com cache de até 1 hora). Cada página lista as URLs exatas consultadas e o horário da coleta.</p>
      <h2 className="text-2xl font-bold">Como ler</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li><b>Dado oficial</b>: reproduzido como publicado pela fonte.</li>
        <li><b>Cálculo da plataforma</b>: somas e rankings feitos por nós a partir dos dados oficiais.</li>
        <li>Valores altos, fornecedores recorrentes ou anomalias <b>não comprovam irregularidade</b>.</li>
        <li>Os mesmos critérios se aplicam a todos os parlamentares, independentemente de partido.</li>
      </ul>
      <h2 className="text-2xl font-bold">Registro de lacunas</h2>
      <table className="w-full text-sm"><thead><tr className="border-b-2 border-foreground text-left"><th className="py-1">Lacuna</th><th>Impacto</th><th>Como fechar</th></tr></thead>
        <tbody>{lacunas.map(([a, b, c]) => <tr key={a} className="border-b border-border"><td className="py-2 pr-2">{a}</td><td className="pr-2">{b}</td><td>{c}</td></tr>)}</tbody></table>
      <h2 className="text-2xl font-bold">Correções</h2>
      <p>Encontrou um erro? A fonte original prevalece; correções são registradas com data.</p>
    </article>
  );
}
