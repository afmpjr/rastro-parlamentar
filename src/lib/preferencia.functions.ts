import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ModoAtividade = "cartao" | "mapa";

/** Modo padrão = o escolhido por mais visitantes; empate ou sem votos fica no Cartão. */
export function modoVencedor(cartao: number, mapa: number): ModoAtividade {
  return mapa > cartao ? "mapa" : "cartao";
}

export const modoPadrao = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { bancoPublico } = await import("./dados.server");
    const db = await bancoPublico();
    const [c, m] = await Promise.all([
      db.from("preferencia_visual").select("visitante", { count: "exact", head: true }).eq("modo", "cartao"),
      db.from("preferencia_visual").select("visitante", { count: "exact", head: true }).eq("modo", "mapa"),
    ]);
    const cartao = c.count ?? 0, mapa = m.count ?? 0;
    return { modo: modoVencedor(cartao, mapa), cartao, mapa };
  } catch (e) {
    console.error(e);
    return { modo: "cartao" as ModoAtividade, cartao: 0, mapa: 0 };
  }
});

export const registrarModo = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ visitante: z.string().uuid(), modo: z.enum(["cartao", "mapa"]) }).parse(d))
  .handler(async ({ data }) => {
    const { bancoPublico } = await import("./dados.server");
    const { error } = await (await bancoPublico()).from("preferencia_visual").upsert({ visitante: data.visitante, modo: data.modo, atualizado_em: new Date().toISOString() });
    if (error) console.error(error);
    return { ok: !error };
  });
