-- Núcleo financeiro v2 — expansão compatível e sem remoção de dados.
-- Aplicar antes da versão da aplicação que grava os novos campos.
BEGIN;

CREATE TABLE IF NOT EXISTS public.categorias_financeiras (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    natureza TEXT NOT NULL CHECK (natureza IN ('receita', 'despesa', 'deducao')),
    grupo_dre TEXT NOT NULL CHECK (grupo_dre IN (
        'receita_operacional', 'deducoes_receita', 'custos_servicos',
        'despesas_operacionais', 'depreciacao_amortizacao',
        'resultado_financeiro', 'fluxo_financiamento', 'tributos_resultado', 'resultado_nao_operacional'
    )),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, codigo),
    UNIQUE (user_id, id)
);

ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own financial categories" ON public.categorias_financeiras;
DROP POLICY IF EXISTS "Users view own financial categories" ON public.categorias_financeiras;
CREATE POLICY "Users view own financial categories"
ON public.categorias_financeiras
FOR SELECT
USING (auth.uid() = user_id);

ALTER TABLE public.veiculos
    ADD COLUMN IF NOT EXISTS data_venda DATE;

ALTER TABLE public.pagamentos
    ADD COLUMN IF NOT EXISTS data_competencia DATE,
    ADD COLUMN IF NOT EXISTS data_vencimento DATE,
    ADD COLUMN IF NOT EXISTS data_liquidacao DATE,
    ADD COLUMN IF NOT EXISTS valor_liquidado NUMERIC(14,2),
    ADD COLUMN IF NOT EXISTS origem TEXT,
    ADD COLUMN IF NOT EXISTS origem_competencia TEXT,
    ADD COLUMN IF NOT EXISTS origem_liquidacao TEXT,
    ADD COLUMN IF NOT EXISTS parcela_numero INTEGER,
    ADD COLUMN IF NOT EXISTS parcelas_total INTEGER,
    ADD COLUMN IF NOT EXISTS categoria_financeira_id BIGINT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID;

ALTER TABLE public.receitas
    ADD COLUMN IF NOT EXISTS data_competencia DATE,
    ADD COLUMN IF NOT EXISTS data_vencimento DATE,
    ADD COLUMN IF NOT EXISTS data_pagamento DATE,
    ADD COLUMN IF NOT EXISTS data_liquidacao DATE,
    ADD COLUMN IF NOT EXISTS valor_liquidado NUMERIC(14,2),
    ADD COLUMN IF NOT EXISTS origem TEXT,
    ADD COLUMN IF NOT EXISTS origem_competencia TEXT,
    ADD COLUMN IF NOT EXISTS origem_liquidacao TEXT,
    ADD COLUMN IF NOT EXISTS parcela_numero INTEGER,
    ADD COLUMN IF NOT EXISTS parcelas_total INTEGER,
    ADD COLUMN IF NOT EXISTS categoria_financeira_id BIGINT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID;

ALTER TABLE public.despesas
    ADD COLUMN IF NOT EXISTS data_competencia DATE,
    ADD COLUMN IF NOT EXISTS data_vencimento DATE,
    ADD COLUMN IF NOT EXISTS data_pagamento DATE,
    ADD COLUMN IF NOT EXISTS data_liquidacao DATE,
    ADD COLUMN IF NOT EXISTS valor_liquidado NUMERIC(14,2),
    ADD COLUMN IF NOT EXISTS origem TEXT,
    ADD COLUMN IF NOT EXISTS origem_competencia TEXT,
    ADD COLUMN IF NOT EXISTS origem_liquidacao TEXT,
    ADD COLUMN IF NOT EXISTS parcela_numero INTEGER,
    ADD COLUMN IF NOT EXISTS parcelas_total INTEGER,
    ADD COLUMN IF NOT EXISTS categoria_financeira_id BIGINT,
    ADD COLUMN IF NOT EXISTS parcelamento_id TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID;

ALTER TABLE public.manutencoes
    ADD COLUMN IF NOT EXISTS data_competencia DATE,
    ADD COLUMN IF NOT EXISTS data_vencimento DATE,
    ADD COLUMN IF NOT EXISTS data_pagamento DATE,
    ADD COLUMN IF NOT EXISTS data_liquidacao DATE,
    ADD COLUMN IF NOT EXISTS valor_liquidado NUMERIC(14,2),
    ADD COLUMN IF NOT EXISTS origem TEXT,
    ADD COLUMN IF NOT EXISTS origem_competencia TEXT,
    ADD COLUMN IF NOT EXISTS origem_liquidacao TEXT,
    ADD COLUMN IF NOT EXISTS parcela_numero INTEGER,
    ADD COLUMN IF NOT EXISTS parcelas_total INTEGER,
    ADD COLUMN IF NOT EXISTS categoria_financeira_id BIGINT,
    ADD COLUMN IF NOT EXISTS parcelamento_id TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID;

ALTER TABLE public.multas
    ADD COLUMN IF NOT EXISTS data_competencia DATE,
    ADD COLUMN IF NOT EXISTS data_vencimento DATE,
    ADD COLUMN IF NOT EXISTS data_pagamento DATE,
    ADD COLUMN IF NOT EXISTS data_liquidacao DATE,
    ADD COLUMN IF NOT EXISTS valor_liquidado NUMERIC(14,2),
    ADD COLUMN IF NOT EXISTS origem TEXT,
    ADD COLUMN IF NOT EXISTS origem_competencia TEXT,
    ADD COLUMN IF NOT EXISTS origem_liquidacao TEXT,
    ADD COLUMN IF NOT EXISTS parcela_numero INTEGER,
    ADD COLUMN IF NOT EXISTS parcelas_total INTEGER,
    ADD COLUMN IF NOT EXISTS categoria_financeira_id BIGINT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID;

ALTER TABLE public.pagamentos ALTER COLUMN created_by SET DEFAULT auth.uid(), ALTER COLUMN updated_by SET DEFAULT auth.uid();
ALTER TABLE public.receitas ALTER COLUMN created_by SET DEFAULT auth.uid(), ALTER COLUMN updated_by SET DEFAULT auth.uid();
ALTER TABLE public.despesas ALTER COLUMN created_by SET DEFAULT auth.uid(), ALTER COLUMN updated_by SET DEFAULT auth.uid();
ALTER TABLE public.manutencoes ALTER COLUMN created_by SET DEFAULT auth.uid(), ALTER COLUMN updated_by SET DEFAULT auth.uid();
ALTER TABLE public.multas ALTER COLUMN created_by SET DEFAULT auth.uid(), ALTER COLUMN updated_by SET DEFAULT auth.uid();

DO $$
DECLARE
    target_table TEXT;
BEGIN
    FOREACH target_table IN ARRAY ARRAY['pagamentos', 'receitas', 'despesas', 'manutencoes', 'multas']
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = target_table || '_categoria_financeira_fk'
        ) THEN
            EXECUTE format(
                'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (user_id, categoria_financeira_id) REFERENCES public.categorias_financeiras(user_id, id) ON DELETE RESTRICT NOT VALID',
                target_table, target_table || '_categoria_financeira_fk'
            );
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.stamp_financial_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := NOW();
    NEW.updated_by := auth.uid();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    target_table TEXT;
BEGIN
    FOREACH target_table IN ARRAY ARRAY['pagamentos', 'receitas', 'despesas', 'manutencoes', 'multas']
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS stamp_financial_update ON public.%I', target_table);
        EXECUTE format(
            'CREATE TRIGGER stamp_financial_update BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.stamp_financial_update()',
            target_table
        );
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_sold_vehicle_financial_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF OLD.status = 'Vendido' AND (
        NEW.status IS DISTINCT FROM OLD.status
        OR NEW.valor_venda IS DISTINCT FROM OLD.valor_venda
        OR NEW.data_venda IS DISTINCT FROM OLD.data_venda
        OR NEW.valor_compra IS DISTINCT FROM OLD.valor_compra
        OR NEW.data_compra IS DISTINCT FROM OLD.data_compra
        OR NEW.placa IS DISTINCT FROM OLD.placa
    ) THEN
        RAISE EXCEPTION 'Veículo vendido exige operação de estorno';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_sold_vehicle_financial_fields ON public.veiculos;
CREATE TRIGGER protect_sold_vehicle_financial_fields
BEFORE UPDATE ON public.veiculos
FOR EACH ROW EXECUTE FUNCTION public.protect_sold_vehicle_financial_fields();

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

CREATE OR REPLACE FUNCTION public.assign_financial_category()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    category_code TEXT;
    base_type TEXT;
    assigned_category_id BIGINT;
BEGIN
    IF NEW.categoria_financeira_id IS NOT NULL THEN RETURN NEW; END IF;
    base_type := regexp_replace(COALESCE(to_jsonb(NEW) ->> 'tipo', ''), '\s+\(\d+/\d+\)\s*$', '');

    category_code := CASE
        WHEN TG_TABLE_NAME = 'pagamentos' THEN 'locacao'
        WHEN TG_TABLE_NAME = 'manutencoes' THEN 'manutencao'
        WHEN TG_TABLE_NAME = 'receitas'
             AND (NEW.origem = 'venda_veiculo' OR base_type ILIKE 'Venda de Veículo%') THEN 'venda_ativo'
        WHEN TG_TABLE_NAME = 'receitas' THEN 'receita_nao_classificada'
        WHEN TG_TABLE_NAME = 'despesas' AND base_type ILIKE 'Seguro' THEN 'seguro'
        WHEN TG_TABLE_NAME = 'despesas' AND base_type ILIKE 'Principal de financiamento' THEN 'principal_financiamento'
        WHEN TG_TABLE_NAME = 'despesas' AND base_type ILIKE 'Juros%' THEN 'juros_encargos'
        WHEN TG_TABLE_NAME = 'despesas' AND base_type ILIKE 'Tributos sobre receita' THEN 'tributos_receita'
        ELSE 'nao_classificada'
    END;

    SELECT id INTO assigned_category_id
    FROM public.categorias_financeiras
    WHERE user_id = NEW.user_id AND codigo = category_code;
    NEW.categoria_financeira_id := assigned_category_id;
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    target_table TEXT;
BEGIN
    FOREACH target_table IN ARRAY ARRAY['pagamentos', 'receitas', 'despesas', 'manutencoes', 'multas']
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS assign_financial_category ON public.%I', target_table);
        EXECUTE format(
            'CREATE TRIGGER assign_financial_category BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.assign_financial_category()',
            target_table
        );
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_venda_veiculo(
    p_veiculo_id INTEGER,
    p_valor_venda NUMERIC,
    p_data_venda DATE,
    p_receitas JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    sold_vehicle public.veiculos%ROWTYPE;
    created_revenues JSONB;
    revenue_total NUMERIC;
    sale_category_id BIGINT;
BEGIN
    IF p_valor_venda <= 0 OR jsonb_array_length(p_receitas) = 0 THEN
        RAISE EXCEPTION 'Venda sem valor ou lançamentos';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_receitas) item
        WHERE (item ->> 'valor')::NUMERIC <= 0
           OR item ->> 'status' NOT IN ('Pago', 'Em aberto')
           OR (
               item ->> 'status' = 'Pago'
               AND (
                   NULLIF(item ->> 'data_liquidacao', '') IS NULL
                   OR (item ->> 'valor_liquidado')::NUMERIC IS DISTINCT FROM (item ->> 'valor')::NUMERIC
               )
           )
           OR (
               item ->> 'status' = 'Em aberto'
               AND (
                   NULLIF(item ->> 'data_liquidacao', '') IS NOT NULL
                   OR NULLIF(item ->> 'valor_liquidado', '') IS NOT NULL
               )
           )
    ) THEN
        RAISE EXCEPTION 'Parcelas de venda possuem liquidação inconsistente';
    END IF;

    SELECT * INTO sold_vehicle
    FROM public.veiculos
    WHERE id = p_veiculo_id AND user_id = auth.uid()
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Veículo não encontrado'; END IF;
    IF sold_vehicle.status = 'Vendido' THEN RAISE EXCEPTION 'Veículo já vendido'; END IF;
    IF EXISTS (
        SELECT 1 FROM public.receitas
        WHERE user_id = auth.uid() AND veiculo_id = p_veiculo_id AND origem = 'venda_veiculo'
    ) THEN
        RAISE EXCEPTION 'Venda já possui lançamentos';
    END IF;

    SELECT COALESCE(SUM((item ->> 'valor')::NUMERIC), 0)
    INTO revenue_total
    FROM jsonb_array_elements(p_receitas) item;
    IF ABS(revenue_total - p_valor_venda) > 0.009 THEN
        RAISE EXCEPTION 'Soma das parcelas difere do valor de venda';
    END IF;

    UPDATE public.veiculos
    SET status = 'Vendido', valor_venda = p_valor_venda, data_venda = p_data_venda
    WHERE id = p_veiculo_id AND user_id = auth.uid()
    RETURNING * INTO sold_vehicle;

    SELECT id INTO sale_category_id
    FROM public.categorias_financeiras
    WHERE user_id = auth.uid() AND codigo = 'venda_ativo';

    WITH inserted AS (
        INSERT INTO public.receitas (
            user_id, tipo, veiculo_placa, veiculo_id, data, valor, status,
            parcelamento_id, data_competencia, data_vencimento, data_pagamento,
            data_liquidacao, valor_liquidado, origem_liquidacao,
            origem, origem_competencia, parcela_numero, parcelas_total,
            categoria_financeira_id
        )
        SELECT
            auth.uid(), x.tipo, x.veiculo_placa, p_veiculo_id, x.data, x.valor, x.status,
            x.parcelamento_id, x.data_competencia, x.data_vencimento, x.data_pagamento,
            x.data_liquidacao, x.valor_liquidado, x.origem_liquidacao,
            'venda_veiculo', 'informada', x.parcela_numero, x.parcelas_total,
            sale_category_id
        FROM jsonb_to_recordset(p_receitas) AS x(
            tipo TEXT, veiculo_placa TEXT, data DATE, valor NUMERIC, status TEXT,
            parcelamento_id TEXT, data_competencia DATE, data_vencimento DATE,
            data_pagamento DATE, data_liquidacao DATE, valor_liquidado NUMERIC,
            origem_liquidacao TEXT, parcela_numero INTEGER, parcelas_total INTEGER
        )
        RETURNING *
    )
    SELECT COALESCE(jsonb_agg(to_jsonb(inserted)), '[]'::jsonb)
    INTO created_revenues FROM inserted;

    RETURN jsonb_build_object('veiculo', to_jsonb(sold_vehicle), 'receitas', created_revenues);
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_venda_veiculo(INTEGER, NUMERIC, DATE, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_venda_veiculo(INTEGER, NUMERIC, DATE, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_asset_sale_revenue()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF OLD.origem IS DISTINCT FROM 'venda_veiculo' THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
        RETURN NEW;
    END IF;
    IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Receita de venda exige estorno transacional'; END IF;
    IF NEW.valor IS DISTINCT FROM OLD.valor
       OR NEW.tipo IS DISTINCT FROM OLD.tipo
       OR NEW.veiculo_id IS DISTINCT FROM OLD.veiculo_id
       OR NEW.veiculo_placa IS DISTINCT FROM OLD.veiculo_placa
       OR NEW.origem IS DISTINCT FROM OLD.origem
       OR NEW.data_competencia IS DISTINCT FROM OLD.data_competencia
       OR NEW.data IS DISTINCT FROM OLD.data
       OR NEW.data_vencimento IS DISTINCT FROM OLD.data_vencimento
       OR NEW.parcelamento_id IS DISTINCT FROM OLD.parcelamento_id
       OR NEW.parcela_numero IS DISTINCT FROM OLD.parcela_numero
       OR NEW.parcelas_total IS DISTINCT FROM OLD.parcelas_total
       OR NEW.categoria_financeira_id IS DISTINCT FROM OLD.categoria_financeira_id
    THEN
        RAISE EXCEPTION 'Campos estruturais da venda são imutáveis';
    END IF;
    IF NEW.status = 'Pago' AND (
        NEW.data_liquidacao IS NULL OR NEW.valor_liquidado IS DISTINCT FROM NEW.valor
    ) THEN
        RAISE EXCEPTION 'Parcela paga exige liquidação integral';
    END IF;
    IF NEW.status <> 'Pago' AND (
        NEW.data_liquidacao IS NOT NULL OR NEW.valor_liquidado IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Parcela aberta não pode possuir liquidação';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_asset_sale_revenue ON public.receitas;
CREATE TRIGGER protect_asset_sale_revenue
BEFORE UPDATE OR DELETE ON public.receitas
FOR EACH ROW EXECUTE FUNCTION public.protect_asset_sale_revenue();

COMMIT;
