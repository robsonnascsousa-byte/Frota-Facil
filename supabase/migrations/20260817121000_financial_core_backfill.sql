-- Backfill conservador: preenche somente competência/vencimento inferidos.
-- Datas de liquidação ausentes nunca são inventadas.
BEGIN;

DO $$
DECLARE
    affected_rows BIGINT;
BEGIN
    SELECT
        (SELECT COUNT(*) FROM public.pagamentos)
        + (SELECT COUNT(*) FROM public.receitas)
        + (SELECT COUNT(*) FROM public.despesas)
        + (SELECT COUNT(*) FROM public.manutencoes)
        + (SELECT COUNT(*) FROM public.multas)
    INTO affected_rows;
    IF affected_rows > 100000 THEN
        RAISE EXCEPTION 'Backfill acima de 100 mil registros: executar versão em lotes';
    END IF;
END;
$$;

UPDATE public.pagamentos
SET
    data_competencia = COALESCE(data_competencia, vencimento),
    data_vencimento = COALESCE(data_vencimento, vencimento),
    data_liquidacao = COALESCE(data_liquidacao, data_pagamento),
    valor_liquidado = CASE
        WHEN data_pagamento IS NOT NULL AND status = 'Pago' THEN COALESCE(valor_liquidado, valor)
        ELSE valor_liquidado
    END,
    origem = COALESCE(origem, 'contrato'),
    origem_competencia = COALESCE(origem_competencia, CASE WHEN data_competencia IS NULL THEN 'legado_inferido' ELSE 'informada' END),
    origem_liquidacao = CASE
        WHEN data_pagamento IS NOT NULL THEN COALESCE(origem_liquidacao, 'informada')
        ELSE origem_liquidacao
    END
WHERE data_competencia IS NULL
   OR data_vencimento IS NULL
   OR origem IS NULL
   OR (data_pagamento IS NOT NULL AND data_liquidacao IS NULL);

UPDATE public.receitas
SET
    data_competencia = COALESCE(data_competencia, data),
    data_vencimento = COALESCE(data_vencimento, data),
    data_liquidacao = COALESCE(data_liquidacao, data_pagamento),
    valor_liquidado = CASE
        WHEN data_pagamento IS NOT NULL AND status = 'Pago' THEN COALESCE(valor_liquidado, valor)
        ELSE valor_liquidado
    END,
    origem = COALESCE(origem, 'legado'),
    origem_competencia = COALESCE(origem_competencia, CASE WHEN data_competencia IS NULL THEN 'legado_inferido' ELSE 'informada' END),
    origem_liquidacao = COALESCE(origem_liquidacao, CASE WHEN data_pagamento IS NOT NULL THEN 'informada' END)
WHERE data_competencia IS NULL OR data_vencimento IS NULL OR origem IS NULL;

UPDATE public.despesas
SET
    data_competencia = COALESCE(data_competencia, data),
    data_vencimento = COALESCE(data_vencimento, data),
    data_liquidacao = COALESCE(data_liquidacao, data_pagamento),
    valor_liquidado = CASE
        WHEN data_pagamento IS NOT NULL AND status = 'Paga' THEN COALESCE(valor_liquidado, valor)
        ELSE valor_liquidado
    END,
    origem = COALESCE(origem, 'legado'),
    origem_competencia = COALESCE(origem_competencia, CASE WHEN data_competencia IS NULL THEN 'legado_inferido' ELSE 'informada' END),
    origem_liquidacao = COALESCE(origem_liquidacao, CASE WHEN data_pagamento IS NOT NULL THEN 'informada' END)
WHERE data_competencia IS NULL OR data_vencimento IS NULL OR origem IS NULL;

UPDATE public.manutencoes
SET
    data_competencia = COALESCE(data_competencia, data),
    data_vencimento = COALESCE(data_vencimento, data),
    data_liquidacao = COALESCE(data_liquidacao, data_pagamento),
    valor_liquidado = CASE
        WHEN data_pagamento IS NOT NULL AND status = 'Paga' THEN COALESCE(valor_liquidado, valor)
        ELSE valor_liquidado
    END,
    origem = COALESCE(origem, 'legado'),
    origem_competencia = COALESCE(origem_competencia, CASE WHEN data_competencia IS NULL THEN 'legado_inferido' ELSE 'informada' END),
    origem_liquidacao = COALESCE(origem_liquidacao, CASE WHEN data_pagamento IS NOT NULL THEN 'informada' END)
WHERE data_competencia IS NULL OR data_vencimento IS NULL OR origem IS NULL;

UPDATE public.multas
SET
    data_competencia = COALESCE(data_competencia, data),
    data_vencimento = COALESCE(data_vencimento, data),
    data_liquidacao = COALESCE(data_liquidacao, data_pagamento),
    valor_liquidado = CASE
        WHEN data_pagamento IS NOT NULL AND status = 'Paga' THEN COALESCE(valor_liquidado, valor)
        ELSE valor_liquidado
    END,
    origem = COALESCE(origem, 'legado'),
    origem_competencia = COALESCE(origem_competencia, CASE WHEN data_competencia IS NULL THEN 'legado_inferido' ELSE 'informada' END),
    origem_liquidacao = COALESCE(origem_liquidacao, CASE WHEN data_pagamento IS NOT NULL THEN 'informada' END)
WHERE data_competencia IS NULL OR data_vencimento IS NULL OR origem IS NULL;

INSERT INTO public.categorias_financeiras (user_id, codigo, nome, natureza, grupo_dre)
SELECT p.id, seed.codigo, seed.nome, seed.natureza, seed.grupo_dre
FROM public.profiles p
CROSS JOIN (VALUES
    ('locacao', 'Receita de locação', 'receita', 'receita_operacional'),
    ('receita_nao_classificada', 'Receita não classificada', 'receita', 'receita_operacional'),
    ('venda_ativo', 'Venda de veículo', 'receita', 'resultado_nao_operacional'),
    ('manutencao', 'Manutenção', 'despesa', 'custos_servicos'),
    ('seguro', 'Seguro', 'despesa', 'custos_servicos'),
    ('principal_financiamento', 'Principal de financiamento', 'despesa', 'fluxo_financiamento'),
    ('juros_encargos', 'Juros e encargos', 'despesa', 'resultado_financeiro'),
    ('tributos_receita', 'Tributos sobre receita', 'deducao', 'deducoes_receita'),
    ('nao_classificada', 'Não classificada', 'despesa', 'despesas_operacionais')
) AS seed(codigo, nome, natureza, grupo_dre)
ON CONFLICT (user_id, codigo) DO NOTHING;

UPDATE public.pagamentos p
SET categoria_financeira_id = c.id
FROM public.categorias_financeiras c
WHERE c.user_id = p.user_id AND c.codigo = 'locacao' AND p.categoria_financeira_id IS NULL;

UPDATE public.receitas r
SET categoria_financeira_id = c.id
FROM public.categorias_financeiras c
WHERE c.user_id = r.user_id
  AND c.codigo = CASE
      WHEN r.origem = 'venda_veiculo' OR r.tipo ILIKE 'Venda de Veículo%' THEN 'venda_ativo'
      ELSE 'receita_nao_classificada'
  END
  AND r.categoria_financeira_id IS NULL;

UPDATE public.manutencoes m
SET categoria_financeira_id = c.id
FROM public.categorias_financeiras c
WHERE c.user_id = m.user_id AND c.codigo = 'manutencao' AND m.categoria_financeira_id IS NULL;

UPDATE public.multas m
SET categoria_financeira_id = c.id
FROM public.categorias_financeiras c
WHERE c.user_id = m.user_id AND c.codigo = 'nao_classificada' AND m.categoria_financeira_id IS NULL;

UPDATE public.despesas d
SET categoria_financeira_id = c.id
FROM public.categorias_financeiras c
WHERE c.user_id = d.user_id
  AND c.codigo = CASE
      WHEN regexp_replace(d.tipo, '\s+\(\d+/\d+\)\s*$', '') ILIKE 'Seguro' THEN 'seguro'
      WHEN regexp_replace(d.tipo, '\s+\(\d+/\d+\)\s*$', '') ILIKE 'Principal de financiamento' THEN 'principal_financiamento'
      WHEN regexp_replace(d.tipo, '\s+\(\d+/\d+\)\s*$', '') ILIKE 'Juros%' THEN 'juros_encargos'
      WHEN regexp_replace(d.tipo, '\s+\(\d+/\d+\)\s*$', '') ILIKE 'Tributos sobre receita' THEN 'tributos_receita'
      ELSE 'nao_classificada'
  END
  AND d.categoria_financeira_id IS NULL;

ALTER TABLE public.pagamentos VALIDATE CONSTRAINT pagamentos_categoria_financeira_fk;
ALTER TABLE public.receitas VALIDATE CONSTRAINT receitas_categoria_financeira_fk;
ALTER TABLE public.despesas VALIDATE CONSTRAINT despesas_categoria_financeira_fk;
ALTER TABLE public.manutencoes VALIDATE CONSTRAINT manutencoes_categoria_financeira_fk;
ALTER TABLE public.multas VALIDATE CONSTRAINT multas_categoria_financeira_fk;

COMMIT;
