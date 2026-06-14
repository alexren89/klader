"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Flame } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn, formatPrice, conditionLabel } from "@/lib/utils";

interface Listing {
  id: string;
  title: string;
  price: number | string;
  condition: string;
  size: string;
  brand?: string | null;
  category: string;
  images: string[];
  views: number;
  _count?: { favorites: number };
  seller: {
    id: string;
    name?: string | null;
    image?: string | null;
    rating?: number;
  };
}

interface ListingCardProps {
  listing: Listing;
  showSeller?: boolean;
}

export function ListingCard({ listing, showSeller = true }: ListingCardProps) {
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const favCount = listing._count?.favorites ?? 0;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
          {listing.images[0] ? (
            <Image
              src={listing.images[0]}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-stone-100">
              <span className="text-5xl opacity-20">👗</span>
            </div>
          )}

          {/* Condition tag */}
          <div className="absolute left-2.5 top-2.5">
            <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-semibold text-stone-700 shadow-sm">
              {conditionLabel(listing.condition)}
            </span>
          </div>

          {/* Favorite button */}
          {session?.user && (
            <button
              onClick={handleFavorite}
              disabled={loading}
              className={cn(
                "absolute right-2.5 top-2.5 rounded-full p-1.5 transition-all shadow-sm",
                favorited
                  ? "bg-red-500 text-white opacity-100"
                  : "bg-white/90 backdrop-blur-sm text-stone-400 opacity-0 group-hover:opacity-100 hover:text-red-400"
              )}
            >
              <Heart className={cn("h-3.5 w-3.5", favorited && "fill-white")} />
            </button>
          )}

          {/* FOMO likes counter */}
          {favCount > 0 && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm shadow-sm",
                favCount >= 5
                  ? "bg-red-500 text-white"
                  : "bg-black/60 text-white"
              )}>
                {favCount >= 5
                  ? <Flame className="h-2.5 w-2.5" />
                  : <Heart className="h-2.5 w-2.5 fill-white" />}
                {favCount} {favCount === 1 ? "persona" : "personas"} lo quieren
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3.5">
          {/* Brand / category label */}
          <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400 mb-1">
            {listing.brand
              ? `${listing.brand} · ${listing.size}`
              : `Talla ${listing.size}`}
          </p>

          {/* Title */}
          <h3 className="text-sm font-semibold text-stone-900 line-clamp-1 leading-snug mb-2">
            {listing.title}
          </h3>

          {/* Price + CTA row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-bold text-stone-900">
              {formatPrice(listing.price)}
            </span>
            <span className="rounded-full border border-stone-200 px-3 py-1 text-[11px] font-medium text-stone-600 transition-colors group-hover:border-stone-900 group-hover:text-stone-900">
              Ver ahora
            </span>
          </div>

          {/* Seller */}
          {showSeller && (
            <div className="mt-2.5 pt-2.5 border-t border-stone-100 flex items-center gap-1.5">
              {listing.seller.image ? (
                <Image
                  src={listing.seller.image}
                  alt={listing.seller.name || ""}
                  width={14}
                  height={14}
                  className="h-3.5 w-3.5 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-sand-200 text-sand-700 text-[8px] font-bold">
                  {listing.seller.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-[11px] text-stone-400 truncate">{listing.seller.name}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
