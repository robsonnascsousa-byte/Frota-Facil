-- Migration to add veiculo_id to receitas table
ALTER TABLE public.receitas 
ADD COLUMN IF NOT EXISTS veiculo_id INTEGER REFERENCES public.veiculos(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_receitas_veiculo ON public.receitas(veiculo_id);

-- Update RLS if necessary (usually not needed if existing policies use user_id)
