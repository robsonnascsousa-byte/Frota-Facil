# Cálculos financeiros e atualização do dashboard

## Competência e liquidação

O retorno acumulado e o resultado acumulado da frota usam competência até o dia atual. Uma receita em aberto já pode estar reconhecida nesse resultado. Sua baixa para Pago altera o caixa, mas não duplica o resultado por competência.

O retorno conserva o custo histórico dos veículos em operação e reconhece ganho ou perda de capital nas vendas. Não usa a valorização estimada pela FIPE para criar lucro e não anualiza o percentual. Financiamentos legados sem separação entre principal e juros ficam fora desse resultado, conforme o aviso da DRE.

O saldo de caixa acumulado registrado mostra os recebimentos menos os pagamentos efetivamente liquidados até hoje. Inclui receitas de vendas, parcelas de financiamento, despesas, manutenções e multas registradas. Não inclui saldo bancário inicial ou aquisições cadastradas apenas na frota, portanto não equivale ao saldo do banco nem ao lucro da DRE.

Todos os indicadores de caixa usam `valor_liquidado` quando informado e o valor do lançamento como fallback. Usam a data de liquidação ou pagamento; registros pagos antigos sem essa data usam o histórico disponível e ficam identificados como inferidos. Baixas novas seguem o dia civil de America/Sao_Paulo.

## Atualizações

- A baixa de contrato grava primeiro no banco e aplica a resposta do servidor ao estado atual. Uma baixa simultânea em outra parcela permanece preservada.
- Controles ficam bloqueados durante a gravação daquele lançamento. Falhas são exibidas e não confirmam a baixa ou fecham o editor como se ela tivesse sido salva.
- Receita mensal e caixa acumulado mudam com a liquidação. O ranking usa receitas operacionais recebidas menos gastos pagos, incluindo receitas manuais e multas; não mistura custos ainda abertos nem venda de ativos.
- O resumo semanal conta entradas pela data do recebimento. O progresso e o valor faltante se referem às cobranças com vencimento na semana, evitando que um recebimento atrasado quite visualmente uma cobrança diferente.
- A inadimplência considera recebimentos vencidos e não pagos, mesmo quando o status ainda está Em aberto. A baixa remove o valor desse total.
- O gráfico de despesas e o total pago do Financeiro incluem multas liquidadas. Financiamentos aparecem como pagamentos, sem serem apresentados como despesas da DRE.
- O seletor de período da DRE identifica o ano completo até hoje, em vez de exibir Janeiro enquanto calcula o acumulado anual.

## Verificação

Execute `npm test`, `npm run typecheck` e `npm run build`. Os testes cobrem a baixa, o valor liquidado, recebimento atrasado e antecipado, corte de datas, ranking por veículo, duas atualizações simultâneas e horário noturno no Brasil.

O fluxo completo também foi validado no navegador com dados fictícios e falhas simuladas de gravação. Nenhum lançamento financeiro real foi alterado durante a análise. As correções precisam ser publicadas para aparecer na aplicação do servidor.
