CREATE OR REPLACE FUNCTION public.resumo_emendas(p_ano int, p_uf text, p_municipio text, p_autor text)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public AS $$
WITH anos AS (SELECT coalesce(jsonb_agg(a ORDER BY a DESC), '[]') j, max(a) mx FROM (SELECT DISTINCT ano a FROM emendas) x),
ufs AS (SELECT coalesce(jsonb_agg(u ORDER BY u), '[]') j FROM (SELECT DISTINCT uf u FROM emendas WHERE uf <> '' AND uf !~* '(sem informa|m[uú]ltiplo|exterior)') x),
sel AS (SELECT e.* FROM emendas e, anos WHERE e.ano = coalesce(nullif(p_ano,0), anos.mx)
  AND (p_uf = '' OR e.uf = p_uf)
  AND (p_municipio = '' OR upper(translate(e.municipio,'ÁÀÂÃÉÊÍÓÔÕÚÇáàâãéêíóôõúç','AAAAEEIOOOUCaaaaeeiooouc')) LIKE '%' || p_municipio || '%')
  AND (p_autor = '' OR upper(translate(e.autor,'ÁÀÂÃÉÊÍÓÔÕÚÇáàâãéêíóôõúç','AAAAEEIOOOUCaaaaeeiooouc')) LIKE '%' || p_autor || '%')),
g AS (SELECT 'autores' k, autor n, sum(empenhado) e, sum(pago) p, sum(qtd) q FROM sel GROUP BY autor
  UNION ALL SELECT 'municipios', municipio, sum(empenhado), sum(pago), sum(qtd) FROM sel GROUP BY municipio
  UNION ALL SELECT 'areas', funcao, sum(empenhado), sum(pago), sum(qtd) FROM sel GROUP BY funcao
  UNION ALL SELECT 'tipos', tipo, sum(empenhado), sum(pago), sum(qtd) FROM sel GROUP BY tipo),
r AS (SELECT k, n, e, p, q, row_number() OVER (PARTITION BY k ORDER BY e DESC) rn FROM g)
SELECT jsonb_build_object(
  'ano', (SELECT coalesce(nullif(p_ano,0), mx) FROM anos), 'anos', (SELECT j FROM anos), 'ufs', (SELECT j FROM ufs),
  'qtd', (SELECT coalesce(sum(qtd),0) FROM sel), 'empenhado', (SELECT coalesce(sum(empenhado),0) FROM sel), 'pago', (SELECT coalesce(sum(pago),0) FROM sel),
  'grupos', (SELECT coalesce(jsonb_object_agg(k, itens), '{}') FROM (SELECT k, jsonb_agg(jsonb_build_object('nome', coalesce(nullif(n,''),'Sem informação'), 'empenhado', e, 'pago', p, 'qtd', q) ORDER BY e DESC) itens FROM r WHERE rn <= CASE k WHEN 'areas' THEN 8 WHEN 'tipos' THEN 6 ELSE 10 END GROUP BY k) z));
$$;
REVOKE ALL ON FUNCTION public.resumo_emendas(int, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resumo_emendas(int, text, text, text) TO service_role;