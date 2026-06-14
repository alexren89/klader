import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Package, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { transformListings } from "@/lib/db-helpers";
import { ListingCard } from "@/components/listings/ListingCard";
import { StarRating } from "@/components/ui/StarRating";
import { formatDate } from "@/lib/utils";

export default async function PublicProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      location: true,
      rating: true,
      totalSales: true,
      createdAt: true,
      listings: {
        where: { status: "ACTIVE", NOT: { hidden: true } },
        include: {
          seller: {
            select: { id: true, name: true, avatar: true, rating: true },
          },
          _count: { select: { favorites: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      receivedReviews: {
        include: {
          reviewer: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name || ""}
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-700 text-2xl font-bold">
              {user.name?.[0]?.toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>

            <div className="flex flex-wrap items-center gap-4 mt-2">
              {user.rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarRating rating={user.rating} size="sm" />
                  <span className="text-sm text-gray-600">
                    {user.rating.toFixed(1)} ({user.receivedReviews.length} reseñas)
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Package className="h-4 w-4 text-gray-400" />
                {user.totalSales} ventas
              </div>
              {user.location && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {user.location}
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Calendar className="h-4 w-4" />
                Miembro desde {formatDate(user.createdAt)}
              </div>
            </div>

            {user.bio && (
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                {user.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Artículos en venta ({user.listings.length})
        </h2>
        {user.listings.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">
            No tiene artículos activos
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {transformListings(user.listings).map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                showSeller={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      {user.receivedReviews.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Reseñas ({user.receivedReviews.length})
          </h2>
          <div className="space-y-3">
            {user.receivedReviews.map((review) => (
              <div key={review.id} className="card p-4">
                <div className="flex items-start gap-3">
                  {review.reviewer.avatar ? (
                    <Image
                      src={review.reviewer.avatar}
                      alt={review.reviewer.name || ""}
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">
                      {review.reviewer.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {review.reviewer.name}
                      </span>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 mt-1">
                        {review.comment}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
