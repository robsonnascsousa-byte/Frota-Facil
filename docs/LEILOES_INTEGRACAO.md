# Integração CarFlippingBR e Frota Fácil

O código do projeto `carflippingbr-avaliador-de-carros-de-leilão-ai`, na área de trabalho, foi examinado para integrar seus fluxos no sistema atual. A pasta original permanece preservada.

## Fluxos integrados

- **Avaliar e simular:** imagens, vídeos, captura pela câmera do dispositivo, estimativa de danos, peças e mão de obra, consulta FIPE existente, simulação de comissão/taxas/recuperação, lance máximo por ROI e pesquisa de preços com fontes.
- **Lotes acompanhados:** dados do leilão, data, leiloeiro, link, lance planejado e estados monitorando, perdido, cancelado ou arrematado.
- **Arrematados e revenda:** veículo compartilhado com a frota, conclusão de recuperação, custos lançados no Financeiro e venda à vista com receita. Vendas parceladas continuam disponíveis em Veículos.

O login e os dados usam Supabase. Firebase, o login Google independente, o servidor Express e o aplicativo Android separado não foram incorporados. A unificação utiliza a estrutura web existente.

## Dados e resultado financeiro

Uma arrematação cria `veiculos` e vincula `leilao_lotes` na mesma transação, impedindo duplicidade por concorrência. Placa e usuário seguem as restrições da frota. O valor de compra inclui lance efetivo, comissão, taxas e custos extras iniciais; reparos estimados não são lançados como despesas reais.

Os custos reais adicionados pelo módulo são despesas em aberto vinculadas ao veículo; o pagamento é registrado no Financeiro. O resultado exibido em Revenda deduz aquisição e despesas lançadas, incluindo as ainda não pagas. Para o resultado acumulado com locações, manutenções, multas e sinistros, consulte Veículos e DRE. Não some a estimativa de reparos aos custos já realizados.

Venda usa `registrar_venda_veiculo`, já existente, com veículo e receita na mesma transação. Lotes arrematados ficam imutáveis como histórico; as alterações operacionais são feitas no veículo compartilhado.

## Ativação no Supabase

O código local pode compilar antes da ativação. Salvar lotes exige a migração; consultar a IA exige a publicação da Edge Function e uma chave Gemini válida.

1. Siga `supabase/MIGRATION_RUNBOOK.md` para confirmar o ledger e as migrações financeiras e de segurança existentes. Não execute `db push` indiscriminadamente: há migrações históricas destrutivas e versões antigas duplicadas no repositório.
2. Teste a migração **20261008120000_auction_integration.sql** em uma cópia isolada do banco. Depois aplique somente essa migração nova usando o procedimento de publicação do projeto. Ela cria tabelas, políticas, gatilhos e funções sem alterar ou apagar as tabelas existentes.
3. Configure `GEMINI_API_KEY` nos secrets das Edge Functions. Não use prefixo `VITE_` e não coloque a chave no frontend.
4. Opcionalmente configure `GEMINI_MODEL`; o padrão é `gemini-3.8-flash`. O modelo deve estar disponível para a chave e suportar mídia, saída estruturada e Google Search.
5. Publique a função `auction-ai` com validação JWT habilitada (padrão). Exemplo, com Supabase CLI já autenticada e projeto correto vinculado: `supabase functions deploy auction-ai`. A função também confirma a sessão usando Supabase Auth e exige admin/gerente pela função de cota.
6. Publique o frontend pelo processo normal do Frota Fácil.

Nunca use `--no-verify-jwt` para esta função. As variáveis automáticas `SUPABASE_URL` e `SUPABASE_ANON_KEY` são usadas apenas no servidor para validar a sessão e executar a cota do chamador. Não há uso de chave service role.

## Permissões e limites

Admin e gerente consultam seus próprios lotes, simulam, arrematam e consultam a IA. Operação não acessa o módulo financeiro de leilões. A proteção é aplicada nas políticas do banco, além da interface. Não há permissão de exclusão de lotes; use o estado cancelado para preservar histórico. A política de veículos existente continua valendo.

Até 6 mídias e 12 MB por análise; formatos JPG, PNG, WebP, MP4 e WebM. A cota de consultas é de 20 por usuário por hora, compartilhada entre instâncias do servidor. Chamadas que chegam ao provedor consomem a cota mesmo quando ele falha. Não há resposta simulada em falhas ou ausência de chave.

As análises são estimativas visuais, não laudos de classificação de monta. A FIPE estimada pela IA deve ser confirmada pela consulta. As pesquisas exibem preços encontrados, links HTTP/HTTPS e fontes de grounding; sem fontes suficientes, a lista pode ficar vazia.

## Validação e publicação

- `npm run typecheck`
- `node node_modules/typescript/bin/tsc -p supabase/functions/auction-ai/tsconfig.json`
- `npm test`
- `npm run check:migrations:new`
- `npm run build`

A migração também foi executada em PostgreSQL isolado com PGlite, usando tabelas de autenticação/frota e funções de auditoria simplificadas. Foram conferidos RLS entre usuários, bloqueio de operação, arrematação repetida, rollback por placa duplicada, placa inválida, valores inválidos, histórico imutável e limite de consultas. Reproduza com `npm install --prefix .tmp/auction-db --no-save --package-lock=false @electric-sql/pglite` e `node scripts/test-auction-migration.mjs`. A dependência fica isolada em `.tmp`, sem entrar no pacote de produção.

Os fluxos de simulação, salvamento de lote, arrematação, custo, conclusão da recuperação e revenda foram conferidos no navegador com respostas Supabase fictícias. O cenário de lance de R$ 30.000, aquisição de R$ 35.000, recuperação de R$ 5.000 e venda de R$ 48.000 resultou em R$ 8.000 e ROI de 20%. Não houve gravações no banco real nem consultas Gemini reais durante a validação.

No ambiente isolado, validar acesso entre dois usuários, operação sem permissão, arrematação repetida, placa duplicada com rollback completo, associação a veículo de outro usuário, histórico imutável, custo no Financeiro, venda com receita e cota da IA. A verificação TypeScript da função não substitui seu teste no runtime Deno nem uma consulta real ao Gemini.

Rollback: reverta a versão do frontend e mantenha os lotes e vínculos no banco. As migrações são forward-only; qualquer correção posterior deve ser uma nova migração. Dados existentes do Firebase não são migrados automaticamente; caso haja registros em nuvem, exporte-os e planeje uma importação separada com conferência de propriedade, placas e custos.

Referências de implementação: [saída estruturada Gemini](https://ai.google.dev/gemini-api/docs/generate-content/structured-output), [autenticação de funções Supabase](https://supabase.com/docs/guides/functions/auth-legacy-jwt).
