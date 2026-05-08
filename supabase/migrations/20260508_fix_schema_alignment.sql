-- =====================================================
-- MIGRATION: Align DB schema with frontend
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. ADD MISSING COLUMNS TO CONTRATOS (denormalized fields used by frontend)
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS veiculo_placa TEXT;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS veiculo_modelo TEXT;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS motorista_nome TEXT;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS plano_nome TEXT;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS documento_anexado TEXT;

-- 2. ADD MISSING COLUMNS TO PLANOS (frontend uses these names)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planos' AND column_name='tipo_cobranca') THEN
        ALTER TABLE planos ADD COLUMN tipo_cobranca TEXT DEFAULT 'Semanal';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planos' AND column_name='valor_base') THEN
        ALTER TABLE planos ADD COLUMN valor_base DECIMAL(12,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planos' AND column_name='franquia_km') THEN
        ALTER TABLE planos ADD COLUMN franquia_km TEXT DEFAULT '0';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planos' AND column_name='status') THEN
        ALTER TABLE planos ADD COLUMN status TEXT DEFAULT 'Ativo';
    END IF;
END $$;

-- 3. ADD veiculo_id to despesas if missing + parcelamento_id
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS parcelamento_id TEXT;

-- 4. CREATE RECEITAS TABLE (missing from original schema)
CREATE TABLE IF NOT EXISTS receitas (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    veiculo_id INTEGER REFERENCES veiculos(id) ON DELETE SET NULL,
    veiculo_placa TEXT,
    tipo TEXT NOT NULL,
    data DATE NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'Em aberto',
    parcelamento_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on receitas
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;

-- RLS policies for receitas
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'receitas' AND policyname = 'Users can view own receitas') THEN
        CREATE POLICY "Users can view own receitas" ON receitas FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'receitas' AND policyname = 'Users can insert own receitas') THEN
        CREATE POLICY "Users can insert own receitas" ON receitas FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'receitas' AND policyname = 'Users can update own receitas') THEN
        CREATE POLICY "Users can update own receitas" ON receitas FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'receitas' AND policyname = 'Users can delete own receitas') THEN
        CREATE POLICY "Users can delete own receitas" ON receitas FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. DROP CONFLICTING CHECK CONSTRAINTS
-- (Names may vary; using common PostgreSQL naming convention)
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT conname, conrelid::regclass AS tablename
        FROM pg_constraint 
        WHERE contype = 'c' 
        AND conrelid::regclass::text IN (
            'contratos','motoristas','pagamentos','despesas',
            'manutencoes','multas','sinistros','documentos','planos'
        )
        AND (conname LIKE '%check%' OR conname LIKE '%status%' OR conname LIKE '%tipo%')
    ) LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', r.tablename, r.conname);
    END LOOP;
END $$;

-- Also drop by explicit names (safety net)
ALTER TABLE contratos DROP CONSTRAINT IF EXISTS contratos_status_check;
ALTER TABLE motoristas DROP CONSTRAINT IF EXISTS motoristas_status_check;
ALTER TABLE pagamentos DROP CONSTRAINT IF EXISTS pagamentos_status_check;
ALTER TABLE despesas DROP CONSTRAINT IF EXISTS despesas_status_check;
ALTER TABLE despesas DROP CONSTRAINT IF EXISTS despesas_tipo_check;
ALTER TABLE manutencoes DROP CONSTRAINT IF EXISTS manutencoes_status_check;
ALTER TABLE manutencoes DROP CONSTRAINT IF EXISTS manutencoes_tipo_check;
ALTER TABLE multas DROP CONSTRAINT IF EXISTS multas_status_check;
ALTER TABLE sinistros DROP CONSTRAINT IF EXISTS sinistros_status_check;
ALTER TABLE sinistros DROP CONSTRAINT IF EXISTS sinistros_tipo_check;
ALTER TABLE documentos DROP CONSTRAINT IF EXISTS documentos_tipo_check;
ALTER TABLE documentos DROP CONSTRAINT IF EXISTS documentos_status_check;

-- 6. RE-ADD CHECK CONSTRAINTS WITH FRONTEND-COMPATIBLE VALUES
ALTER TABLE contratos ADD CONSTRAINT contratos_status_check 
    CHECK (status IN ('Em vigor', 'Encerrado', 'Em atraso'));

ALTER TABLE motoristas ADD CONSTRAINT motoristas_status_check 
    CHECK (status IN ('Ativo', 'Inadimplente', 'Histórico'));

ALTER TABLE pagamentos ADD CONSTRAINT pagamentos_status_check 
    CHECK (status IN ('Pago', 'Em aberto', 'Atrasado'));

ALTER TABLE despesas ADD CONSTRAINT despesas_status_check 
    CHECK (status IN ('Paga', 'Em aberto'));

ALTER TABLE manutencoes ADD CONSTRAINT manutencoes_status_check 
    CHECK (status IN ('Paga', 'Em aberto'));

ALTER TABLE multas ADD CONSTRAINT multas_status_check 
    CHECK (status IN ('Paga', 'Em aberto', 'Em recurso'));

ALTER TABLE sinistros ADD CONSTRAINT sinistros_status_check 
    CHECK (status IN ('Em análise', 'Indenizado', 'Concluído'));

-- 7. CLEAN ALL EXISTING DATA (order matters due to foreign keys)
DELETE FROM pagamentos;
DELETE FROM multas;
DELETE FROM sinistros;
DELETE FROM manutencoes;
DELETE FROM despesas;
DELETE FROM receitas;
DELETE FROM documentos;
DELETE FROM contratos;
DELETE FROM motoristas;
DELETE FROM planos;
DELETE FROM veiculos;
-- Keep profiles and configuracoes (user accounts)

-- =====================================================
-- DONE! Schema is now aligned with frontend.
-- =====================================================
