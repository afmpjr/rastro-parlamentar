import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

const Entrada = z.object({
  etapa: z.enum(["diaria", "parlamentares", "camara", "senado", "emendas"]).default("diaria"),
  ano: z.number().int().min(2019).max(2100).optional(),
});

export const Route = createFileRoute("/api/public/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const negado = await authenticateCronRequest(request);
        if (negado) return negado;
        let entrada: z.infer<typeof Entrada>;
        try { entrada = Entrada.parse(await request.json()); }
        catch { return Response.json({ erro: "Parâmetros inválidos" }, { status: 400 }); }
        try {
          const sync = await import("@/lib/sync.server");
          const ano = entrada.ano ?? new Date().getFullYear();
          const resultado = entrada.etapa === "diaria" ? await sync.sincronizarDiario()
            : entrada.etapa === "parlamentares" ? await sync.sincronizarParlamentares()
            : entrada.etapa === "camara" ? await sync.sincronizarCeap(ano)
            : entrada.etapa === "emendas" ? await sync.sincronizarEmendas()
            : await sync.sincronizarCeaps(ano);
          return Response.json({ sucesso: true, resultado });
        } catch (e) {
          console.error("Falha na sincronização", e);
          return Response.json({ sucesso: false, erro: "A fonte oficial ou a gravação falhou; a coleta anterior foi preservada." }, { status: 502 });
        }
      },
    },
  },
});
