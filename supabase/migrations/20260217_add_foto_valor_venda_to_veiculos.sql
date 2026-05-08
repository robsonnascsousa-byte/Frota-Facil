
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS valor_venda DECIMAL(12,2);

-- Atualizar cache do schema (opcional, mas bom pra garantir)
NOTIFY pgrst, 'reload config';
