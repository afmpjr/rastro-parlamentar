CREATE TABLE public.emendas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ano int NOT NULL, tipo text NOT NULL, autor text NOT NULL, municipio text NOT NULL, uf text NOT NULL, funcao text NOT NULL,
  qtd int NOT NULL, empenhado numeric NOT NULL, pago numeric NOT NULL
);
GRANT ALL ON public.emendas TO service_role;
ALTER TABLE public.emendas ENABLE ROW LEVEL SECURITY;
CREATE INDEX emendas_ano_idx ON public.emendas (ano, uf);