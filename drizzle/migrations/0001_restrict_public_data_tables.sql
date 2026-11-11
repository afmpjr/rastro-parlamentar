DROP POLICY IF EXISTS "Parlamentares são públicos" ON public.parlamentares;
DROP POLICY IF EXISTS "Despesas são públicas" ON public.despesas;
DROP POLICY IF EXISTS "Fornecedores são públicos" ON public.fornecedores;
DROP POLICY IF EXISTS "Coletas são públicas" ON public.coletas;
REVOKE ALL ON public.parlamentares, public.despesas, public.fornecedores, public.coletas FROM anon, authenticated;
GRANT ALL ON public.parlamentares, public.despesas, public.fornecedores, public.coletas TO service_role;