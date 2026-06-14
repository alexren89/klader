"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ShoppingCart,
  MapPin,
  Star,
  Package,
  Eye,
  Heart,
  Edit,
  Check,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CommissionDisplay } from "@/components/commission/CommissionDisplay";
import {
  formatPrice,
  formatDate,
  conditionLabel,
  conditionColor,
} from "@/lib/utils";
import type { CommissionCalculation } from "@/lib/commission";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number | string;
  condition: string;
  size: string;
  brand?: string | null;
  category: string;
  images: string[];
  status: string;
  views: number;
  createdAt: string;
  seller: {
    id: string;
    name?: string | null;
    image?: string | null;
    rating: number;
    totalSales: number;
    bio?: string | null;
    location?: string | null;
    createdAt: string;
    _count: { listings: number };
  };
  _count: { favorites: number };
}

interface Props {
  listing: Listing;
  commission: CommissionCalculation;
  isOwner: boolean;
  currentUserId?: string;
}

export function ListingDetailClient({
  listing,
  commission,
  isOwner,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [contactLoading, setContactLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const handleContact = async () => {
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    setContactLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      if (res.ok) {
        const convo = await res.json();
        router.push(`/messages/${convo.id}`);
      }
    } finally {
      setContactLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    router.push(`/checkout/${listing.id}`);
  };

  const handleStatusChange = async (status: string) => {
    setStatusUpdating(true);
    try {
      await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/browse"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
            {listing.images[currentImage] ? (
              <Image
                src={listing.images[currentImage]}
                alt={listing.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">
                👗
              </div>
            )}

            {listing.images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImage((prev) =>
                      prev === 0 ? listing.images.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentImage((prev) =>
                      prev === listing.images.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {listing.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        i === currentImage ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {listing.status !== "ACTIVE" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Badge variant="danger" size="sm" className="text-sm px-4 py-2">
                  {listing.status === "SOLD"
                    ? "Vendido"
                    : listing.status === "RESERVED"
                    ? "Reservado"
                    : "No disponible"}
                </Badge>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {listing.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {listing.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === currentImage
                      ? "border-sage-500"
                      : "border-transparent"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {listing.title}
              </h1>
              {listing.brand && (
                <p className="text-sm text-gray-500 mt-0.5">{listing.brand}</p>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-400 shrink-0">
              <Eye className="h-4 w-4" />
              {listing.views}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Badge
              variant={
                conditionColor(listing.condition) as
                  | "success"
                  | "info"
                  | "warning"
                  | "default"
              }
            >
              {conditionLabel(listing.condition)}
            </Badge>
            <Badge variant="outline">Talla {listing.size}</Badge>
            <Badge variant="outline">{listing.category}</Badge>
          </div>

          <div className="mt-6">
            <CommissionDisplay
              basePrice={Number(listing.price)}
              mode="full"
            />
          </div>

          <div className="mt-4 space-y-2">
            <h2 className="text-sm font-semibold text-gray-700">Descripción</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>

          {/* Actions */}
          {!isOwner ? (
            listing.status === "ACTIVE" && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleBuy}
                  disabled={buyLoading}
                  className="btn-primary flex-1 justify-center py-3"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Comprar ahora
                </button>
                <button
                  onClick={handleContact}
                  disabled={contactLoading}
                  className="btn-secondary flex-1 justify-center py-3"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contactar
                </button>
              </div>
            )
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={`/listings/${listing.id}/edit`}
                className="btn-secondary justify-center"
              >
                <Edit className="h-4 w-4" />
                Editar artículo
              </Link>
              {listing.status === "ACTIVE" && (
                <button
                  onClick={() => handleStatusChange("INACTIVE")}
                  disabled={statusUpdating}
                  className="btn-ghost justify-center text-gray-600"
                >
                  <X className="h-4 w-4" />
                  Desactivar
                </button>
              )}
              {listing.status === "INACTIVE" && (
                <button
                  onClick={() => handleStatusChange("ACTIVE")}
                  disabled={statusUpdating}
                  className="btn-ghost justify-center text-sage-600"
                >
                  <Check className="h-4 w-4" />
                  Activar
                </button>
              )}
              {listing.status !== "SOLD" && (
                <button
                  onClick={() => handleStatusChange("SOLD")}
                  disabled={statusUpdating}
                  className="btn-ghost justify-center text-earth-600"
                >
                  <Package className="h-4 w-4" />
                  Marcar como vendido
                </button>
              )}
            </div>
          )}

          {/* Seller */}
          <div className="mt-6 card p-4">
            <Link
              href={`/profile/${listing.seller.id}`}
              className="flex items-center gap-3 hover:opacity-80"
            >
              {listing.seller.image ? (
                <Image
                  src={listing.seller.image}
                  alt={listing.seller.name || ""}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-sage-700 text-lg font-semibold">
                  {listing.seller.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">
                  {listing.seller.name}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  {listing.seller.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-earth-400 text-earth-400" />
                      <span className="text-xs text-gray-600">
                        {listing.seller.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-gray-500">
                    {listing.seller.totalSales} ventas
                  </span>
                  {listing.seller.location && (
                    <div className="flex items-center gap-0.5 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {listing.seller.location}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-400 text-center">
            Publicado el {formatDate(listing.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
