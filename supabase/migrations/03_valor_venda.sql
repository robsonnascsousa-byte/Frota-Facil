-- Add valor_venda column to veiculos table
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS valor_venda NUMERIC;
