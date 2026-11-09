CREATE TABLE public.parlamentares (
  casa text NOT NULL CHECK (casa IN ('camara','senado')),
  id text NOT NULL,
  nome text NOT NULL,
  partido text NOT NULL,
  uf text NOT NULL,
  foto text NOT NULL DEFAULT '',
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (casa, id)
);
GRANT SELECT ON public.parlamentares TO anon, authenticated;
GRANT ALL ON public.parlamentares TO service_role;
ALTER TABLE public.parlamentares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parlamentares são públicos" ON public.parlamentares FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.coletas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fonte text NOT NULL,
  url text NOT NULL,
  iniciado_em timestamptz NOT NULL DEFAULT now(),
  concluido_em timestamptz,
  status text NOT NULL CHECK (status IN ('executando','sucesso','erro')),
  registros integer NOT NULL DEFAULT 0,
  hash_sha256 text,
  mensagem text
);
GRANT SELECT ON public.coletas TO anon, authenticated;
GRANT ALL ON public.coletas TO service_role;
ALTER TABLE public.coletas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coletas são públicas" ON public.coletas FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.despesas (
  casa text NOT NULL CHECK (casa IN ('camara','senado')),
  parlamentar_id text NOT NULL,
  ano integer NOT NULL,
  mes integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
  data text NOT NULL DEFAULT '',
  categoria text NOT NULL,
  fornecedor text NOT NULL,
  cnpj_cpf text NOT NULL DEFAULT '',
  valor numeric(14,2) NOT NULL,
  documento_url text,
  linha_hash text NOT NULL,
  coleta_id bigint NOT NULL REFERENCES public.coletas(id) ON DELETE RESTRICT,
  PRIMARY KEY (casa, linha_hash)
);
GRANT SELECT ON public.despesas TO anon, authenticated;
GRANT ALL ON public.despesas TO service_role;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Despesas são públicas" ON public.despesas FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX despesas_ano_valor_idx ON public.despesas (ano, casa, valor DESC);
CREATE INDEX despesas_parlamentar_idx ON public.despesas (casa, parlamentar_id, ano);
CREATE INDEX despesas_fornecedor_idx ON public.despesas (cnpj_cpf, fornecedor);

CREATE TABLE public.fornecedores (
  casa text NOT NULL CHECK (casa IN ('camara','senado')),
  cnpj_cpf text NOT NULL,
  nome text NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (casa, cnpj_cpf)
);
GRANT SELECT ON public.fornecedores TO anon, authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fornecedores são públicos" ON public.fornecedores FOR SELECT TO anon, authenticated USING (true);