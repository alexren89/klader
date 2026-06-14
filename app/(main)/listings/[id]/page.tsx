import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { transformListing } from "@/lib/db-helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ListingDetailClient } from "./ListingDetailClient";
import { calculateCommission } from "@/lib/commission";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { title: true, description: true, images: true },
  });
  if (!listing) return {};
  return {
    title: listing.title,
    description: listing.description.slice(0, 160),
    openGraph: { images: listing.images[0] ? [listing.images[0]] : [] },
  };
}

export default async function ListingPage({
  params,
}: {
  params: { id: string };
}) {
  const [listing, session] = await Promise.all([
    prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
            rating: true,
            totalSales: true,
            bio: true,
            location: true,
            createdAt: true,
            _count: { select: { listings: { where: { status: "ACTIVE" } } } },
          },
        },
        _count: { select: { favorites: true } },
      },
    }),
    getServerSession(authOptions),
  ]);

  if (!listing) notFound();

  const commission = await calculateCommission(Number(listing.price));
  const isOwner = session?.user?.id === listing.sellerId;
  const transformed = transformListing(listing);

  return (
    <ListingDetailClient
      listing={JSON.parse(JSON.stringify(transformed))}
      commission={commission}
      isOwner={isOwner}
      currentUserId={session?.user?.id}
    />
  );
}
