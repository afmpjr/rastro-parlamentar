import { createServerFn } from "@tanstack/react-start";

export const listarColetas = createServerFn({ method: "GET" }).handler(async () => {
  const { bancoPublico } = await import("./dados.server");
  const { data, error } = await bancoPublico().from("coletas").select("id,fonte,url,iniciado_em,concluido_em,status,registros,hash_sha256,mensagem").order("iniciado_em", { ascending: false }).limit(60);
  if (error) throw error;
  return { coletas: data };
});
