-- FrotaFácil - Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor (supabase.com > Your Project > SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS PROFILE (extends Supabase Auth)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    nome TEXT,
    empresa TEXT,
    telefone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- VEÍCULOS
-- =====================================================
CREATE TABLE IF NOT EXISTS veiculos (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    codigo TEXT NOT NULL,
    placa TEXT NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    ano INTEGER NOT NULL,
    cor TEXT,
    km_atual INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Disponível' CHECK (status IN ('Disponível', 'Locado', 'Em manutenção', 'Vendido')),
    motorista_atual TEXT,
    vencimento_seguro DATE,
    valor_compra DECIMAL(12,2) DEFAULT 0,
    data_compra DATE,
    valor_fipe DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, placa),
    UNIQUE(user_id, codigo)
);

-- =====================================================
-- MOTORISTAS
-- =====================================================
CREATE TABLE IF NOT EXISTS motoristas (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL,
    whatsapp TEXT,
    cidade TEXT,
    status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Bloqueado')),
    vencimento_cnh DATE,
    data_cadastro DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, cpf)
);

-- =====================================================
-- PLANOS DE LOCAÇÃO
-- =====================================================
CREATE TABLE IF NOT EXISTS planos (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    valor_semanal DECIMAL(12,2) DEFAULT 0,
    km_incluido INTEGER DEFAULT 0,
    valor_km_excedente DECIMAL(8,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONTRATOS
-- =====================================================
CREATE TABLE IF NOT EXISTS contratos (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    veiculo_id INTEGER REFERENCES veiculos(id) ON DELETE SET NULL,
    motorista_id INTEGER REFERENCES motoristas(id) ON DELETE SET NULL,
    plano_id INTEGER REFERENCES planos(id) ON DELETE SET NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Vencido', 'Encerrado', 'Renovado')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAGAMENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    contrato_id INTEGER REFERENCES contratos(id) ON DELETE CASCADE NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    vencimento DATE NOT NULL,
    status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago', 'Atrasado')),
    data_pagamento DATE,
    metodo_pagamento TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MANUTENÇÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS manutencoes (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    veiculo_id INTEGER REFERENCES veiculos(id) ON DELETE CASCADE,
    veiculo_placa TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Preventiva', 'Corretiva', 'Revisão', 'Funilaria', 'Elétrica', 'Outros')),
    descricao TEXT NOT NULL,
    data DATE NOT NULL,
    valor DECIMAL(12,2) DEFAULT 0,
    km INTEGER,
    status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em andamento', 'Concluída', 'Paga')),
    oficina TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MULTAS
-- =====================================================
CREATE TABLE IF NOT EXISTS multas (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    veiculo_id INTEGER REFERENCES veiculos(id) ON DELETE SET NULL,
    veiculo_placa TEXT NOT NULL,
    motorista_id INTEGER REFERENCES motoristas(id) ON DELETE SET NULL,
    motorista_nome TEXT,
    data DATE NOT NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Paga', 'Recorrendo', 'Cancelada')),
    pontos INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SINISTROS
-- =====================================================
CREATE TABLE IF NOT EXISTS sinistros (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    veiculo_id INTEGER REFERENCES veiculos(id) ON DELETE SET NULL,
    veiculo_placa TEXT NOT NULL,
    motorista_id INTEGER REFERENCES motoristas(id) ON DELETE SET NULL,
    motorista_nome TEXT,
    data DATE NOT NULL,
    descricao TEXT NOT NULL,
    valor_prejuizo DECIMAL(12,2) DEFAULT 0,
    valor_recuperado DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'Em análise' CHECK (status IN ('Em análise', 'Aprovado', 'Negado', 'Pago', 'Pendente')),
    tipo TEXT CHECK (tipo IN ('Colisão', 'Roubo', 'Furto', 'Incêndio', 'Alagamento', 'Outros')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DESPESAS
-- =====================================================
CREATE TABLE IF NOT EXISTS despesas (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    veiculo_id INTEGER REFERENCES veiculos(id) ON DELETE SET NULL,
    veiculo_placa TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('Combustível', 'Seguro', 'IPVA', 'Licenciamento', 'Lavagem', 'Estacionamento', 'Outros')),
    descricao TEXT,
    data DATE NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Paga')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DOCUMENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('CRLV', 'Seguro', 'IPVA', 'Licenciamento', 'Contrato', 'CNH', 'Outros')),
    referencia TEXT NOT NULL,
    vencimento DATE NOT NULL,
    status TEXT DEFAULT 'Válido' CHECK (status IN ('Válido', 'Próximo Vencimento', 'Vencido')),
    arquivo_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONFIGURAÇÕES DO USUÁRIO
-- =====================================================
CREATE TABLE IF NOT EXISTS configuracoes (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    empresa_nome TEXT,
    empresa_cnpj TEXT,
    empresa_telefone TEXT,
    empresa_endereco TEXT,
    empresa_email TEXT,
    moeda TEXT DEFAULT 'BRL',
    formato_data TEXT DEFAULT 'DD/MM/YYYY',
    itens_por_pagina INTEGER DEFAULT 10,
    alerta_dias_cnh INTEGER DEFAULT 30,
    alerta_dias_documentos INTEGER DEFAULT 30,
    alerta_dias_manutencao INTEGER DEFAULT 7,
    alerta_dias_inadimplencia INTEGER DEFAULT 5,
    email_ativo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE manutencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE multas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinistros ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Generic policy function for user-owned data
CREATE OR REPLACE FUNCTION create_user_policies(table_name TEXT) RETURNS VOID AS $$
BEGIN
    EXECUTE format('CREATE POLICY "Users can view own %I" ON %I FOR SELECT USING (auth.uid() = user_id)', table_name, table_name);
    EXECUTE format('CREATE POLICY "Users can insert own %I" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', table_name, table_name);
    EXECUTE format('CREATE POLICY "Users can update own %I" ON %I FOR UPDATE USING (auth.uid() = user_id)', table_name, table_name);
    EXECUTE format('CREATE POLICY "Users can delete own %I" ON %I FOR DELETE USING (auth.uid() = user_id)', table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply policies to all tables
SELECT create_user_policies('veiculos');
SELECT create_user_policies('motoristas');
SELECT create_user_policies('planos');
SELECT create_user_policies('contratos');
SELECT create_user_policies('pagamentos');
SELECT create_user_policies('manutencoes');
SELECT create_user_policies('multas');
SELECT create_user_policies('sinistros');
SELECT create_user_policies('despesas');
SELECT create_user_policies('documentos');
SELECT create_user_policies('configuracoes');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_veiculos_user ON veiculos(user_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_status ON veiculos(status);
CREATE INDEX IF NOT EXISTS idx_motoristas_user ON motoristas(user_id);
CREATE INDEX IF NOT EXISTS idx_contratos_user ON contratos(user_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_contrato ON pagamentos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo ON manutencoes(veiculo_placa);
CREATE INDEX IF NOT EXISTS idx_documentos_vencimento ON documentos(vencimento);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_veiculos_updated_at BEFORE UPDATE ON veiculos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_motoristas_updated_at BEFORE UPDATE ON motoristas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planos_updated_at BEFORE UPDATE ON planos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON contratos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION TO CREATE PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    
    INSERT INTO public.configuracoes (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- DONE! Your database schema is ready.
-- =====================================================
