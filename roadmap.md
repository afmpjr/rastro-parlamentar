# Roadmap — Plenário Aberto

## Estrela-guia
Cidadãos sabem o que seus parlamentares federais fazem e gastam com dinheiro público.
Métrica: pessoas que abrem o perfil de um parlamentar a cada semana.

## MVP — consolidação e publicação
- [x] Encontrar representantes: busca, lista com filtros, mapa por partido e páginas de partido e estado.
- [x] Entender atuação: perfis de deputados e senadores, despesas com gráficos, agenda, desempenho, proposições e votos.
- [x] Investigar projetos: busca na Câmara e no Senado, situação, autores, relatores, tramitação, documentos e votos nominais.
- [x] Comparar e participar: comparador lado a lado e teste de compatibilidade com votações reais.
- [x] Conferir a origem: fontes oficiais, horário de coleta e explicação dos cálculos da plataforma.
- [ ] Revisar os fluxos principais em celular e computador, incluindo carregamento, vazio, erro e navegação por teclado.
- [ ] Conferir pontos ainda não validados: votos por período no perfil do senador e identificação dos projetos nas perguntas do teste.
- [ ] Melhorar o filtro de situação da Câmara enquanto não houver banco: buscar dos mais antigos aos recentes ao selecionar "Arquivada".
- [ ] Publicar o MVP e medir a estrela-guia.

**Critério de saída:** uma pessoa encontra seu representante, entende gastos e votos, abre a fonte oficial e compartilha o endereço sem depender de explicação externa.

## Fase 1 — base de dados e atualização diária
- [ ] Ativar o Lovable Cloud e criar tabelas de parlamentares, despesas, fornecedores, proposições, votações e coletas.
- [ ] Importar a legislatura atual e as despesas do ano atual e anterior, com URL, horário e hash de cada coleta.
- [ ] Agendar sincronização diária protegida e registrar falhas sem apagar a última coleta válida.
- [ ] Migrar rankings e filtros globais para consultas no banco, mantendo os dados oficiais ao vivo como fallback quando fizer sentido.
- [ ] Criar visão de saúde das coletas e testes das regras de atualização e acesso.

**Critério de saída:** despesas dos 594 parlamentares consultáveis sem baixar arquivos anuais a cada visita, com histórico e procedência preservados.

## Fase 2 — explorar o dinheiro público
- [ ] Ranking de parlamentares por gasto, com paginação e filtros por casa, partido, estado, período, categoria e faixa de valor na URL.
- [ ] Comparação entre dois períodos: total, diferença em reais e percentual, e categorias que mais mudaram.
- [ ] Página por fornecedor: CNPJ/CPF, total recebido, parlamentares pagantes, categorias e evolução temporal.
- [ ] Paginação e filtros consistentes na lista de parlamentares e nas demais listas extensas.

**Critério de saída:** responder "quem gastou mais, com o quê, com quem e como isso mudou" sem esperar consultas parlamentar por parlamentar.

## Fase 3 — votos e representação
- [ ] Situação de projetos filtrável em todo o universo de resultados, inclusive arquivados da Câmara.
- [ ] Alinhamento ao governo calculado somente com orientações oficiais de votação; manter separado de classificações editoriais.
- [ ] Comparador e teste de compatibilidade sobre o histórico armazenado, com recorte por ano e legislatura.
- [ ] Explicitar cobertura e limites: votações simbólicas, ausências, abstenções e mudanças de partido ou mandato.

**Critério de saída:** comparar comportamento político com universo conhecido, critérios reproduzíveis e fonte oficial em cada conclusão.

## Depois — somente com nova priorização
- [ ] Dúvidas sobre votações com IA (adiado pelo usuário; só com respostas ancoradas nas fontes oficiais).
- [ ] Contratos, emendas, transferências, estados e municípios.
- [ ] Alertas, favoritos e outras funcionalidades que exijam contas de usuário.
