"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

function KladerMarkPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--neutral-100)" }}>
      <svg width="40" height="40" viewBox="0 0 100 100" fill="none" style={{ opacity: 0.15 }}>
        <path d="M50 14 a36 36 0 1 1 -25.5 10.5" stroke="#231337" strokeWidth="11" strokeLinecap="round" />
        <circle cx="50" cy="14" r="6.4" fill="#231337" />
      </svg>
    </div>
  );
}

const CONDITION_STYLE: Record<string, { bg: string; color: string }> = {
  NEW:      { bg: "var(--plum-50)",   color: "var(--plum-600)" },
  LIKE_NEW: { bg: "var(--plum-100)",  color: "var(--plum-700)" },
  GOOD:     { bg: "var(--neutral-100)", color: "var(--neutral-600)" },
  FAIR:     { bg: "var(--neutral-100)", color: "var(--neutral-500)" },
};

export function ListingCard({ listing, showSeller = true }: { listing: Listing; showSeller?: boolean }) {
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const favCount = listing._count?.favorites ?? 0;
  const condStyle = CONDITION_STYLE[listing.condition] ?? CONDITION_STYLE.GOOD;

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
      <div
        className="flex flex-col"
        style={{
          background: "var(--bg-surface)",
          borderRadius: 14,
          transition: `transform 200ms var(--ease-out), box-shadow 200ms var(--ease-out)`,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(35,19,55,0.13)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = "";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "";
        }}
      >
        {/* Media — 3:4 portrait */}
        <div className="relative overflow-hidden" style={{ aspectRatio: "3/4", borderRadius: 14 }}>
          {listing.images[0] ? (
            <Image
              src={listing.images[0]}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <KladerMarkPlaceholder />
          )}

          {/* Condition badge */}
          <div className="absolute left-2.5 top-2.5">
            <span
              className="inline-flex items-center rounded-pill px-2.5 py-1 text-[10px] font-semibold"
              style={{ background: condStyle.bg, color: condStyle.color, letterSpacing: "0.04em" }}
            >
              {conditionLabel(listing.condition)}
            </span>
          </div>

          {/* FOMO / likes */}
          {favCount > 0 && (
            <div className="absolute bottom-2.5 left-2.5">
              <span
                className="inline-flex items-center gap-1 rounded-pill px-2 py-1 text-[10px] font-semibold backdrop-blur-sm"
                style={{
                  background: favCount >= 5 ? "var(--coral-400)" : "rgba(35,19,55,0.65)",
                  color: favCount >= 5 ? "var(--plum-900)" : "#fff",
                }}
              >
                {favCount >= 5 ? "🔥" : "♡"} {favCount}
              </span>
            </div>
          )}

          {/* Favorite button */}
          {session?.user && (
            <button
              onClick={handleFavorite}
              disabled={loading}
              className={cn(
                "absolute right-2.5 top-2.5 h-9 w-9 rounded-full border-none flex items-center justify-center transition-all",
                "opacity-0 group-hover:opacity-100",
                favorited && "opacity-100"
              )}
              style={{
                background: favorited ? "var(--coral-400)" : "rgba(255,255,255,0.92)",
                color: favorited ? "var(--plum-900)" : "var(--neutral-500)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span style={{ fontSize: 17, lineHeight: 1 }}>{favorited ? "♥" : "♡"}</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "10px 4px 8px" }}>
          {/* Brand overline */}
          {listing.brand && (
            <p className="text-[10px] font-semibold uppercase truncate"
              style={{ letterSpacing: "0.1em", color: "var(--text-brand)", marginBottom: 2 }}>
              {listing.brand}
            </p>
          )}

          {/* Title */}
          <p className="text-sm font-medium line-clamp-1 leading-snug"
            style={{ color: "var(--text-primary)", marginBottom: 6 }}>
            {listing.title}
          </p>

          {/* Price + size row */}
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-sm font-medium"
              style={{ fontFamily: "var(--font-mono, 'Martian Mono', monospace)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
            >
              {formatPrice(listing.price)}
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {listing.size}
            </span>
          </div>

          {/* Seller */}
          {showSeller && (
            <div className="mt-2 pt-2 flex items-center gap-1.5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              {listing.seller.image ? (
                <Image
                  src={listing.seller.image}
                  alt={listing.seller.name || ""}
                  width={14} height={14}
                  className="h-3.5 w-3.5 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold"
                  style={{ background: "var(--plum-100)", color: "var(--plum-600)" }}
                >
                  {listing.seller.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                {listing.seller.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
