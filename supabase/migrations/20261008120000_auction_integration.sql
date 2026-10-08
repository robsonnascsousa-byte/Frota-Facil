-- Expansão: módulo de leilões sobre o cadastro e núcleo financeiro existentes.
-- Pré-requisito: migrações financial_core e security_audit_hardening.
-- Rollback: reverter a aplicação e manter estas tabelas para preservar o histórico.
BEGIN;
CREATE TABLE public.leilao_lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  marca TEXT NOT NULL CHECK (length(btrim(marca)) BETWEEN 1 AND 200),
  modelo TEXT NOT NULL CHECK (length(btrim(modelo)) BETWEEN 1 AND 300),
  ano INTEGER NOT NULL CHECK (ano BETWEEN 1900 AND 2100),
  valor_fipe NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (valor_fipe BETWEEN 0 AND 100000000),
  lance NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (lance BETWEEN 0 AND 100000000),
  comissao_percentual NUMERIC(5,2) NOT NULL DEFAULT 5 CHECK (comissao_percentual BETWEEN 0 AND 100),
  taxas NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (taxas BETWEEN 0 AND 100000000),
  custos_extras NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (custos_extras BETWEEN 0 AND 100000000),
  reparos_estimados NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (reparos_estimados BETWEEN 0 AND 100000000),
  revenda_estimada NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (revenda_estimada BETWEEN 0 AND 100000000),
  data_leilao DATE,
  leiloeiro TEXT NOT NULL DEFAULT '' CHECK (length(leiloeiro) <= 200),
  numero_lote TEXT NOT NULL DEFAULT '' CHECK (length(numero_lote) <= 100),
  link TEXT NOT NULL DEFAULT '' CHECK (link = '' OR (link ~ '^https?://' AND length(link) <= 2000)),
  notas TEXT NOT NULL DEFAULT '' CHECK (length(notas) <= 10000),
  status TEXT NOT NULL DEFAULT 'monitorando' CHECK (status IN ('monitorando', 'arrematado', 'perdido', 'cancelado')),
  analise JSONB CHECK (analise IS NULL OR (jsonb_typeof(analise) = 'object' AND pg_column_size(analise) <= 100000)),
  veiculo_id INTEGER UNIQUE REFERENCES public.veiculos(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((status = 'arrematado') = (veiculo_id IS NOT NULL))
);
CREATE INDEX leilao_lotes_owner_date ON public.leilao_lotes(user_id, created_at DESC);
ALTER TABLE public.leilao_lotes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.leilao_lotes FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.leilao_lotes TO authenticated;
CREATE POLICY leilao_read ON public.leilao_lotes FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) AND public.get_user_role() IN ('admin', 'gerente'));
CREATE POLICY leilao_insert ON public.leilao_lotes FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.get_user_role() IN ('admin', 'gerente'));
CREATE POLICY leilao_update ON public.leilao_lotes FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND public.get_user_role() IN ('admin', 'gerente'))
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.get_user_role() IN ('admin', 'gerente'));

CREATE FUNCTION public.proteger_lote_leilao() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
    IF NEW.veiculo_id IS NOT NULL THEN RAISE EXCEPTION 'Cadastre o lote antes de arrematar'; END IF;
  ELSE
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Identidade do lote é imutável';
    END IF;
    NEW.created_at := OLD.created_at;
    IF OLD.veiculo_id IS NOT NULL AND NEW IS DISTINCT FROM OLD THEN
      RAISE EXCEPTION 'Lote arrematado é histórico; edite o veículo na frota';
    END IF;
  END IF;
  IF NEW.veiculo_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.veiculos WHERE id = NEW.veiculo_id AND user_id = NEW.user_id
      AND marca = NEW.marca AND modelo = NEW.modelo
      AND valor_compra = round(NEW.lance * (1 + NEW.comissao_percentual / 100) + NEW.taxas + NEW.custos_extras, 2)
  ) THEN RAISE EXCEPTION 'Veículo vinculado inválido'; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.proteger_lote_leilao() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER proteger_lote_leilao BEFORE INSERT OR UPDATE ON public.leilao_lotes
  FOR EACH ROW EXECUTE FUNCTION public.proteger_lote_leilao();
CREATE TRIGGER audit_leilao_lotes AFTER INSERT OR UPDATE ON public.leilao_lotes
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- SECURITY INVOKER mantém as políticas de frota e propriedade do chamador.
-- Trava do lote impede arrematar duas vezes; criação e vínculo são atômicos.
CREATE FUNCTION public.arrematar_lote(p_lote_id UUID, p_placa TEXT, p_data_compra DATE, p_lance NUMERIC)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE lote public.leilao_lotes; veiculo public.veiculos; custo NUMERIC;
BEGIN
  IF auth.uid() IS NULL OR public.get_user_role() NOT IN ('admin', 'gerente') THEN RAISE EXCEPTION 'Não autorizado'; END IF;
  IF p_lance IS NULL OR p_lance <= 0 OR p_lance > 100000000 OR p_lance::text IN ('NaN', 'Infinity', '-Infinity')
    OR p_data_compra IS NULL OR p_data_compra > CURRENT_DATE THEN RAISE EXCEPTION 'Compra inválida'; END IF;
  p_placa := upper(regexp_replace(coalesce(p_placa, ''), '[^A-Za-z0-9]', '', 'g'));
  IF p_placa !~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$' THEN RAISE EXCEPTION 'Informe uma placa válida'; END IF;
  SELECT * INTO lote FROM public.leilao_lotes WHERE id = p_lote_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR lote.status <> 'monitorando' OR lote.veiculo_id IS NOT NULL THEN RAISE EXCEPTION 'Lote indisponível para arrematação'; END IF;
  p_lance := round(p_lance, 2);
  IF p_lance <= 0 THEN RAISE EXCEPTION 'Compra inválida'; END IF;
  custo := round(p_lance * (1 + lote.comissao_percentual / 100) + lote.taxas + lote.custos_extras, 2);
  INSERT INTO public.veiculos(user_id, codigo, placa, marca, modelo, ano, status, km_atual, valor_compra, data_compra, valor_fipe)
  VALUES (auth.uid(), 'L-' || lote.id::text, p_placa, lote.marca, lote.modelo, lote.ano, 'Em manutenção', 0, custo, p_data_compra, lote.valor_fipe)
  RETURNING * INTO veiculo;
  UPDATE public.leilao_lotes SET status = 'arrematado', veiculo_id = veiculo.id, lance = round(p_lance, 2)
    WHERE id = lote.id RETURNING * INTO lote;
  RETURN jsonb_build_object('lote', to_jsonb(lote), 'veiculo', to_jsonb(veiculo));
END;
$$;
REVOKE ALL ON FUNCTION public.arrematar_lote(UUID, TEXT, DATE, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.arrematar_lote(UUID, TEXT, DATE, NUMERIC) TO authenticated;

-- Contador compartilhado entre instâncias da função. Sem acesso direto do cliente.
CREATE TABLE public.leilao_ai_cotas (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  janela TIMESTAMPTZ NOT NULL,
  consultas INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, janela)
);
ALTER TABLE public.leilao_ai_cotas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.leilao_ai_cotas FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.consumir_consulta_leilao() RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE usadas INTEGER;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente')
  ) THEN RAISE EXCEPTION 'Não autorizado'; END IF;
  INSERT INTO public.leilao_ai_cotas(user_id, janela) VALUES (auth.uid(), date_trunc('hour', now()))
    ON CONFLICT (user_id, janela) DO UPDATE SET consultas = public.leilao_ai_cotas.consultas + 1
    RETURNING consultas INTO usadas;
  IF usadas > 20 THEN RAISE EXCEPTION 'Limite de consultas atingido'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.consumir_consulta_leilao() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consumir_consulta_leilao() TO authenticated;
COMMIT;
