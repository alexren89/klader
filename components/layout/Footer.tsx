import Link from "next/link";

function KladerMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M50 14 a36 36 0 1 1 -25.5 10.5" stroke="#5C2E8E" strokeWidth="11" strokeLinecap="round" />
      <circle cx="50" cy="14" r="6.4" fill="#FF7E6B" />
    </svg>
  );
}

const LINKS = {
  Comprar: [
    { label: "Mujer",      href: "/browse?category=mujer" },
    { label: "Hombre",     href: "/browse?category=hombre" },
    { label: "Calzado",    href: "/browse?category=calzado" },
    { label: "Accesorios", href: "/browse?category=accesorios" },
  ],
  Vender: [
    { label: "Publicar artículo", href: "/listings/new" },
    { label: "Mi perfil",         href: "/profile" },
    { label: "Mis pedidos",       href: "/orders" },
  ],
  Klader: [
    { label: "Cómo funciona", href: "#" },
    { label: "Comisiones",    href: "#" },
    { label: "Ayuda",         href: "#" },
    { label: "Privacidad",    href: "#" },
  ],
};

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <KladerMark size={26} />
              <span
                style={{
                  fontFamily: "var(--font-display, 'Unbounded', sans-serif)",
                  fontWeight: 600,
                  fontSize: 16,
                  letterSpacing: "-0.02em",
                  color: "var(--brand-primary)",
                }}
              >
                klader
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Moda de segunda mano. Compra y vende de forma sostenible.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                {section}
              </h3>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm transition-colors text-neutral-500 hover:text-plum-500"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2"
          style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} Klader. Todos los derechos reservados.
          </p>
          <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
            Hecho con <span style={{ color: "var(--coral-400)" }}>♥</span> para la moda sostenible
          </p>
        </div>
      </div>
    </footer>
  );
}
