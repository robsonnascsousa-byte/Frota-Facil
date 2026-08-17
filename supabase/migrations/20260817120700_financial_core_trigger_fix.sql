-- Corrige a comparação tri-valorada para aceitar o backfill de registros legados
-- cuja origem ainda é nula, preservando a imutabilidade das vendas estruturadas.
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
