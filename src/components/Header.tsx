import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="border-b-4 border-double border-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-6 py-5">
        <Link to="/" className="font-display text-3xl font-bold tracking-tight">Plenário Aberto</Link>
        <nav className="flex gap-6 text-sm font-medium uppercase tracking-wider">
          <Link to="/parlamentares" activeProps={{ className: "text-primary" }}>Parlamentares</Link>
          <Link to="/proposicoes" search={{ casa: "camara", q: "", tipo: "", numero: "", ano: "", autor: "", tema: "", tramitando: "", grupo: "", pagina: 1 }} activeProps={{ className: "text-primary" }}>Projetos</Link>
          <Link to="/comparar" search={{ casa: "camara", ano: new Date().getFullYear(), ids: "" }} activeProps={{ className: "text-primary" }}>Comparar</Link>
          <Link to="/compatibilidade" activeProps={{ className: "text-primary" }}>Teste</Link>
          <Link to="/metodologia" activeProps={{ className: "text-primary" }}>Metodologia</Link>
        </nav>
      </div>
    </header>
  );
}
