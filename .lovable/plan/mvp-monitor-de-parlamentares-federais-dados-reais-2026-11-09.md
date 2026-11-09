# MVP — Monitor de Parlamentares Federais (dados reais)

Primeira fatia da plataforma descrita no Master Prompt: deputados federais e senadores, com dados oficiais e evidência rastreável em cada informação.

## O que o usuário verá
- **Início**: busca por nome, partido ou UF; números gerais; explicação da metodologia.
- **Lista de parlamentares**: filtros por casa (Câmara/Senado), partido, UF, situação.
- **Perfil do parlamentar**: dados básicos, mandato, despesas da cota parlamentar (CEAP) por mês e categoria, principais fornecedores, proposições de autoria, votações recentes, presença.
- **Fornecedores**: página por CNPJ/CPF com quais parlamentares pagaram e quanto.
- **Fonte em todo dado**: link para o registro original, data da coleta e órgão de origem. Rótulos claros separando "dado oficial" de "cálculo da plataforma".
- **Página de metodologia e limitações** (inclui aviso: anomalia não é irregularidade).

## Fontes (APIs públicas, sem chave)
- API Dados Abertos da Câmara (deputados, despesas, proposições, votações).
- API Dados Abertos do Senado (senadores, mandatos).
- Despesas do Senado (CEAPS) via arquivos públicos — validar disponibilidade; registrar no Gap Register se falhar.

## Dados e atualização
- Lovable Cloud para armazenar parlamentares, despesas, fornecedores, proposições e registro de coletas (fonte, URL, data, hash).
- Rotina de sincronização agendada (diária) + botão administrativo para forçar coleta.
- Primeira carga: legislatura atual, despesas dos últimos 12 meses.
- Leitura pública sem login; área admin (login) só para disparar/monitorar coletas.

## Fora do MVP (registrado no Gap Register)
Contratos, emendas, transferências, estados/municípios, grafos, IA analítica, alertas.

## Detalhes técnicos
- TanStack Start; leituras via server functions com cliente público + RLS somente leitura.
- Sincronização em rota `/api/public/sync` protegida por segredo (cron), paginando as APIs e fazendo upsert.
- Tabelas: parlamentares, despesas, fornecedores, proposicoes, votacoes, coletas (proveniência).
- Visual: estilo editorial/jornalístico sóbrio, tipografia serifada para títulos, gráficos com Recharts.
- `roadmap.md` + Gap Register na raiz.
