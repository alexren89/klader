import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transformListings } from "@/lib/db-helpers";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { listingId } = await req.json();

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: session.user.id, listingId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({
    data: { userId: session.user.id, listingId },
  });

  return NextResponse.json({ favorited: true });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
        include: {
          seller: { select: { id: true, name: true, avatar: true, rating: true } },
          _count: { select: { favorites: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const listings = transformListings(favorites.map((f) => f.listing));
  return NextResponse.json(listings);
}
