-- Novo status de veículo: "Inativo".
-- Carro que saiu da operação sem ter sido vendido (parado, sinistrado, em
-- disputa, guardado). Junto com "Vendido", fica fora da taxa de ocupação:
-- não está disponível para gerar receita, então inflava o denominador.

ALTER TABLE veiculos DROP CONSTRAINT IF EXISTS veiculos_status_check;

ALTER TABLE veiculos
    ADD CONSTRAINT veiculos_status_check
    CHECK (status IN ('Disponível', 'Locado', 'Em manutenção', 'Vendido', 'Inativo'));
