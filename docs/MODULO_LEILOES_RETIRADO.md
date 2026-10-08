# Retirada do módulo de leilões e revenda

Em 08/10/2026, o módulo foi retirado deste sistema a pedido do responsável pelo projeto, para desenvolvimento futuro em uma aplicação específica.

Foram removidos a página, os menus, a busca global, os serviços, os tipos, os cálculos, os testes exclusivos e o código da Edge Function `auction-ai`. O sistema mantém a gestão de frota, as vendas de veículos e o Financeiro existentes, além da correção no carregamento das permissões da sessão.

A pasta original na área de trabalho permanece preservada: `C:\Users\robso\Desktop\carflippingbr-avaliador-de-carros-de-leilão-ai`. A implementação integrada pode ser recuperada pelo histórico do Git.

A migração `supabase/migrations/20261008120000_auction_integration.sql` permanece como histórico versionado. Nenhuma tabela, função, lote ou registro financeiro foi apagado do banco nesta retirada. Uma eventual limpeza do schema deve usar uma nova migração, após conferir os dados e as dependências.

Esta alteração é local. A aplicação publicada precisa receber uma nova build. A exclusão do código da Edge Function no repositório não remove uma função que já tenha sido publicada no Supabase; a retirada remota dessa função deve ser tratada separadamente no ambiente correspondente.
