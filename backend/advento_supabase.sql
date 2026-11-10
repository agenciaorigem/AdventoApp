-- Advento Tour 2026 - Tabela e Configurações no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase (https://app.supabase.com)

-- 1. Criação da tabela para o Advento
CREATE TABLE IF NOT EXISTS public.advento_site (
  id INT PRIMARY KEY DEFAULT 1,
  revision INT NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.advento_site ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acesso (Leitura pública e gravação liberada)
DROP POLICY IF EXISTS "Public access to advento_site" ON public.advento_site;
CREATE POLICY "Public access to advento_site" 
ON public.advento_site 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Habilitar sincronização em tempo real (Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE public.advento_site;

-- 5. Inserir registro inicial caso não exista
INSERT INTO public.advento_site (id, revision, data)
VALUES (
  1, 
  0, 
  '{"seats": [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false], "pin": "2026"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
