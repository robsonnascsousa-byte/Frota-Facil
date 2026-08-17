-- Mantidos em migração separada. O executor gerenciado aplica cada migração em
-- uma transação, portanto estes índices não usam CONCURRENTLY.
CREATE INDEX IF NOT EXISTS pagamentos_user_competencia_idx ON public.pagamentos (user_id, data_competencia);
CREATE INDEX IF NOT EXISTS pagamentos_user_liquidacao_idx ON public.pagamentos (user_id, data_liquidacao);
CREATE INDEX IF NOT EXISTS receitas_user_competencia_idx ON public.receitas (user_id, data_competencia);
CREATE INDEX IF NOT EXISTS receitas_user_liquidacao_idx ON public.receitas (user_id, data_liquidacao);
CREATE INDEX IF NOT EXISTS despesas_user_competencia_idx ON public.despesas (user_id, data_competencia);
CREATE INDEX IF NOT EXISTS despesas_user_liquidacao_idx ON public.despesas (user_id, data_liquidacao);
CREATE INDEX IF NOT EXISTS manutencoes_user_competencia_idx ON public.manutencoes (user_id, data_competencia);
CREATE INDEX IF NOT EXISTS manutencoes_user_liquidacao_idx ON public.manutencoes (user_id, data_liquidacao);
