import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Leaf } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { transformListings } from "@/lib/db-helpers";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/ui/Skeleton";
import { Suspense } from "react";

const CATEGORIES = [
  { label: "Mujer",      value: "mujer",      emoji: "👗" },
  { label: "Hombre",     value: "hombre",     emoji: "👔" },
  { label: "Calzado",    value: "calzado",    emoji: "👟" },
  { label: "Accesorios", value: "accesorios", emoji: "👜" },
  { label: "Deportiva",  value: "deportiva",  emoji: "🏃" },
  { label: "Vintage",    value: "vintage",    emoji: "✨" },
];

async function FeaturedListings() {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE", NOT: { hidden: true }, seller: { NOT: { vacationMode: true } } },
    include: {
      seller: { select: { id: true, name: true, image: true, rating: true } },
      _count: { select: { favorites: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const transformed = transformListings(listings);

  if (transformed.length === 0) {
    return (
      <div className="py-20 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        Aún no hay artículos. ¡Sé el primero en vender!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4">
      {transformed.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

function FeaturedListingsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
    </div>
  );
}

export default function HomePage() {
  return (
    <div style={{ background: "var(--bg-page)" }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--plum-50)" }}
      >
        {/* Watermark loop mark */}
        <div
          className="absolute pointer-events-none select-none"
          style={{ right: -60, top: -40, opacity: 0.10 }}
        >
          <svg width="480" height="480" viewBox="0 0 100 100" fill="none">
            <path d="M50 14 a36 36 0 1 1 -25.5 10.5" stroke="#231337" strokeWidth="11" strokeLinecap="round" />
            <circle cx="50" cy="14" r="6.4" fill="#231337" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <span
              className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold mb-5"
              style={{
                background: "var(--plum-100)",
                color: "var(--plum-600)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <Leaf className="h-3 w-3" />
              Moda circular · segunda mano sin complicaciones
            </span>

            <h1
              className="text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mb-5"
              style={{
                fontFamily: "var(--font-display, 'Unbounded', sans-serif)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--plum-900)",
              }}
            >
              Dale ropa<br />
              <span style={{ color: "var(--brand-primary)" }}>una segunda vida.</span>
            </h1>

            <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: "var(--text-secondary)" }}>
              Compra y vende moda de segunda mano. Directo a tu puerta, con protección al comprador en cada pedido.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/browse"
                className="btn-primary"
                style={{ gap: 8, paddingLeft: 28, paddingRight: 28, height: 52, fontSize: 15 }}
              >
                Explorar artículos <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/listings/new"
                className="inline-flex items-center gap-2 rounded-pill px-7 text-sm font-semibold transition-all hover:bg-plum-50"
                style={{
                  border: "1.5px solid var(--plum-300)",
                  color: "var(--brand-primary)",
                  height: 52,
                  background: "transparent",
                }}
              >
                Vender ahora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────────────── */}
      <div style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-10 sm:gap-20 py-3 overflow-x-auto">
            {[
              { icon: ShieldCheck, text: "Pago 100% seguro" },
              { icon: Zap,         text: "Publicar es gratis" },
              { icon: Leaf,        text: "Moda sostenible" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex shrink-0 items-center gap-2 text-xs font-medium"
                style={{ color: "var(--text-muted)" }}>
                <Icon className="h-3.5 w-3.5" style={{ color: "var(--brand-primary)" }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Categories ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-2">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Explorar por categoría
          </h2>
          <Link href="/browse"
            className="text-xs font-semibold flex items-center gap-1 transition-colors"
            style={{ color: "var(--text-muted)" }}>
            Ver todo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              href={`/browse?category=${cat.value}`}
              className="group flex flex-col items-center gap-2 px-3 py-5 transition-all duration-200
                         bg-white rounded-[20px] border border-neutral-200 shadow-[0_1px_2px_rgba(35,19,55,0.06)]
                         hover:-translate-y-1 hover:shadow-[0_6px_18px_rgba(35,19,55,0.10)] hover:border-plum-200"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-[11px] font-semibold text-neutral-600 group-hover:text-plum-500 transition-colors">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured listings ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-lg"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}
            >
              Recién publicados
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Los últimos artículos añadidos</p>
          </div>
          <Link href="/browse"
            className="inline-flex items-center gap-1 text-xs font-semibold transition-colors"
            style={{ color: "var(--brand-primary)" }}>
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <Suspense fallback={<FeaturedListingsSkeleton />}>
          <FeaturedListings />
        </Suspense>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="py-14" style={{ background: "var(--brand-primary)" }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2
            className="text-xl text-center mb-8 text-white"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "-0.02em" }}
          >
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { num: "01", title: "Publica tu artículo",    desc: "Sube fotos, describe la prenda y fija tu precio. En minutos estará visible." },
              { num: "02", title: "Vende con seguridad",    desc: "El pago queda en custodia hasta que el comprador confirma la entrega." },
              { num: "03", title: "Haz el bien al planeta", desc: "Cada compra de segunda mano reduce el impacto de la industria textil." },
            ].map((step) => (
              <div key={step.num} className="flex gap-4 p-5"
                style={{ borderRadius: 20, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}>
                <span className="shrink-0 text-3xl font-black" style={{ color: "rgba(255,255,255,0.20)", fontFamily: "var(--font-display)" }}>
                  {step.num}
                </span>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">{step.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────────────── */}
      <section className="py-14" style={{ background: "var(--plum-900)" }}>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2
            className="text-2xl sm:text-3xl text-white mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "-0.02em" }}
          >
            ¿Tienes ropa que ya no usas?
          </h2>
          <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.55)" }}>
            Únete a miles de vendedores y dale una segunda vida a tu armario.
          </p>
          <Link
            href="/listings/new"
            className="btn-accent"
            style={{ paddingLeft: 28, paddingRight: 28, height: 52, fontSize: 15, display: "inline-flex", gap: 8, borderRadius: 999 }}
          >
            Empezar a vender <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
