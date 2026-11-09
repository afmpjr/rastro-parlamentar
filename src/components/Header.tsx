import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

function Links({ aoNavegar }: { aoNavegar?: () => void }) {
  return (
    <>
      <Link to="/parlamentares" onClick={aoNavegar} activeProps={{ className: "text-primary" }}>Parlamentares</Link>
      <Link to="/proposicoes" onClick={aoNavegar} search={{ casa: "camara", q: "", tipo: "", numero: "", ano: "", autor: "", tema: "", tramitando: "", grupo: "", pagina: 1 }} activeProps={{ className: "text-primary" }}>Projetos</Link>
      <Link to="/comparar" onClick={aoNavegar} search={{ casa: "camara", ano: new Date().getFullYear(), ids: "" }} activeProps={{ className: "text-primary" }}>Comparar</Link>
      <Link to="/compatibilidade" onClick={aoNavegar} activeProps={{ className: "text-primary" }}>Teste</Link>
      <Link to="/coletas" onClick={aoNavegar} activeProps={{ className: "text-primary" }}>Atualizações</Link>
      <Link to="/metodologia" onClick={aoNavegar} activeProps={{ className: "text-primary" }}>Metodologia</Link>
    </>
  );
}

export function Header() {
  const [aberto, setAberto] = useState(false);
  return (
    <header className="border-b-4 border-double border-foreground">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between gap-4 md:items-end">
          <Link to="/" onClick={() => setAberto(false)} className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Plenário Aberto</Link>
          <nav aria-label="Navegação principal" className="hidden gap-5 text-sm font-medium uppercase tracking-wider md:flex [&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center">
            <Links />
          </nav>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border md:hidden"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={aberto}
            aria-controls="menu-principal"
            onClick={() => setAberto((v) => !v)}
          >
            {aberto ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
        {aberto && (
          <nav id="menu-principal" aria-label="Navegação principal" className="mt-4 grid grid-cols-2 gap-1 border-t pt-3 text-sm font-medium uppercase tracking-wider md:hidden [&_a]:flex [&_a]:min-h-11 [&_a]:items-center">
            <Links aoNavegar={() => setAberto(false)} />
          </nav>
        )}
      </div>
    </header>
  );
}
