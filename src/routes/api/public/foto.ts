import { createFileRoute } from "@tanstack/react-router";

const HOSTS = new Set(["www.camara.leg.br", "camara.leg.br", "www.senado.leg.br", "senado.leg.br", "legis.senado.leg.br"]);

// Proxy de fotos oficiais: evita bloqueios do navegador ao carregar direto das Casas.
export const Route = createFileRoute("/api/public/foto")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url).searchParams.get("u") ?? "";
        let alvo: URL;
        try { alvo = new URL(u); } catch { return new Response("url inválida", { status: 400 }); }
        if (alvo.protocol !== "https:" || !HOSTS.has(alvo.hostname) || !/\.(jpe?g|png|gif)$/i.test(alvo.pathname))
          return new Response("origem não permitida", { status: 400 });
        const r = await fetch(alvo.toString(), { headers: { "user-agent": "Mozilla/5.0 PlenarioAberto" } });
        if (!r.ok) return new Response("foto indisponível", { status: 404 });
        return new Response(r.body, { headers: { "content-type": r.headers.get("content-type") ?? "image/jpeg", "cache-control": "public, max-age=86400" } });
      },
    },
  },
});
