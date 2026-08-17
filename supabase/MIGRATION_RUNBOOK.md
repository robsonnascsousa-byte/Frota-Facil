# Runbook — núcleo financeiro v2

## Ordem obrigatória

1. Confirmar backup/PITR e restaurá-lo em ambiente isolado.
2. Executar supabase migration list e conferir o ledger remoto.
3. Não executar 20260508_fix_schema_alignment.sql em banco populado: ela contém exclusões de dados.
4. Reconciliar também a colisão histórica da versão 20260519 entre add_parcelamento_manutencoes e fix_manutencoes_alignment; não renomear arquivos que já possam constar no ledger.
5. Se 20260508 estiver pendente, bloquear db push. Após backup e conferência do schema, usar supabase migration repair --status applied 20260508 e documentar a decisão.
6. Aplicar 20260817120000_financial_core_expand.sql.
7. Aplicar 20260817120500_financial_core_indexes.sql e confirmar que o executor não envolve CREATE INDEX CONCURRENTLY em transação.
8. Aplicar 20260817121000_financial_core_backfill.sql.
9. Validar contagens e somas por tabela e usuário.
10. Publicar a aplicação com leitura compatível e gravação dos campos novos.
11. Aplicar 20260817122000_security_audit_hardening.sql após testar a matriz de papéis.

## Validações mínimas

- Comparar count(*) e sum(valor) antes/depois em pagamentos, receitas, despesas, manutenções e multas.
- Confirmar que cadastro com metadata role=admin cria perfil operacao.
- Confirmar que usuários não alteram o próprio papel.
- Testar venda à vista e parcelada: veículo e receitas devem ser gravados ou revertidos juntos.
- Conferir DRE por competência e fluxo de caixa por liquidação.
- npm run check:migrations bloqueia a baseline destrutiva por padrão. A opção --allow-destructive-baseline só é permitida para banco comprovadamente vazio.

## Rollback

As migrações são forward-only. Em incidente, reverta a aplicação; mantenha as colunas novas e use uma migração compensatória. Não remova campos nem apague o backfill em produção.
