/** Leituras dos dados oficiais feitas só no servidor; as tabelas não aceitam acesso direto do navegador. */
export async function bancoPublico() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
