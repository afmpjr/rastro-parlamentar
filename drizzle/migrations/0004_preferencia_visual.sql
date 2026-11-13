CREATE TABLE public.preferencia_visual (
  visitante uuid PRIMARY KEY,
  modo text NOT NULL CHECK (modo IN ('cartao','mapa')),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.preferencia_visual FROM anon, authenticated;
GRANT ALL ON public.preferencia_visual TO service_role;
ALTER TABLE public.preferencia_visual ENABLE ROW LEVEL SECURITY;