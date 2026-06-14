import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Leaf } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { transformListings } from "@/lib/db-helpers";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/ui/Skeleton";
import { Suspense } from "react";

const CATEGORIES = [
  { label: "Mujer",     value: "mujer",      icon: "👗" },
  { label: "Hombre",    value: "hombre",     icon: "👔" },
  { label: "Calzado",   value: "calzado",    icon: "👟" },
  { label: "Accesorios",value: "accesorios", icon: "👜" },
  { label: "Deportiva", value: "deportiva",  icon: "🏃" },
  { label: "Vintage",   value: "vintage",    icon: "✨" },
];

async function FeaturedListings() {
  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      NOT: { hidden: true },
      seller: { NOT: { vacationMode: true } },
    },
    include: {
      seller: { select: { id: true, name: true, avatar: true, rating: true } },
      _count: { select: { favorites: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const transformed = transformListings(listings);

  if (transformed.length === 0) {
    return (
      <div className="py-20 text-center text-stone-400 text-sm">
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
      {Array.from({ length: 8 }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="bg-stone-50">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-sand-400">
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(ellipse at 70% 30%, #fff 0%, transparent 60%)" }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-medium text-white mb-5 backdrop-blur-sm">
              <Leaf className="h-3 w-3" />
              Moda circular · segunda mano sin complicaciones
            </span>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight">
              Tu armario,<br />reinventado.
            </h1>

            <p className="mt-5 text-lg text-white/75 max-w-lg leading-relaxed">
              Encuentra piezas únicas a precios increíbles. Vende lo que ya no usas en minutos.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/browse"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition-all hover:bg-stone-100 hover:gap-3 shadow-sm">
                Explorar artículos <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/listings/new"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20 backdrop-blur-sm">
                Vender ahora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ─────────────────────────────────── */}
      <div className="bg-white border-b border-stone-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-10 sm:gap-20 py-3 overflow-x-auto">
            {[
              { icon: ShieldCheck, text: "Pago 100% seguro" },
              { icon: Zap,         text: "Publicar es gratis" },
              { icon: Leaf,        text: "Moda sostenible" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex shrink-0 items-center gap-2 text-xs font-medium text-stone-500">
                <Icon className="h-3.5 w-3.5 text-sand-500" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Categories ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-2">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-stone-900">Explorar por categoría</h2>
          <Link href="/browse"
            className="text-xs font-medium text-stone-400 hover:text-stone-700 transition-colors flex items-center gap-1">
            Ver todo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              href={`/browse?category=${cat.value}`}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-white border border-stone-100 px-3 py-5 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5 hover:border-sand-200"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-[11px] font-semibold text-stone-600 group-hover:text-stone-900 transition-colors">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured listings ──────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Recién publicados</h2>
            <p className="text-xs text-stone-400 mt-0.5">Los últimos artículos añadidos</p>
          </div>
          <Link href="/browse"
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900 hover:underline">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <Suspense fallback={<FeaturedListingsSkeleton />}>
          <FeaturedListings />
        </Suspense>
      </section>

      {/* ── How it works ───────────────────────────────── */}
      <section className="bg-sand-400 py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-white mb-8 text-center">¿Cómo funciona?</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { num: "01", title: "Publica tu artículo",     desc: "Sube fotos, describe la prenda y fija tu precio. En minutos estará visible." },
              { num: "02", title: "Vende con seguridad",     desc: "El pago queda en custodia hasta que el comprador confirma la entrega." },
              { num: "03", title: "Haz el bien al planeta",  desc: "Cada compra de segunda mano reduce el impacto de la industria textil." },
            ].map((step) => (
              <div key={step.num} className="flex gap-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-5">
                <span className="shrink-0 text-3xl font-black text-white/20">{step.num}</span>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-white/65 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ─────────────────────────────────── */}
      <section className="bg-stone-900 py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            ¿Tienes ropa que ya no usas?
          </h2>
          <p className="text-stone-400 text-sm mb-7">
            Únete a miles de vendedores y dale una segunda vida a tu armario.
          </p>
          <Link href="/listings/new"
            className="inline-flex items-center gap-2 rounded-full bg-sand-400 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-sand-500 hover:gap-3 shadow-sm">
            Empezar a vender <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
