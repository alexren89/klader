import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/db-helpers";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { buyerId: session.user.id },
        { sellerId: session.user.id },
      ],
    },
    include: {
      buyer: { select: { id: true, name: true, image: true } },
      seller: { select: { id: true, name: true, image: true } },
      listing: { select: { id: true, title: true, images: true, price: true, status: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          messages: {
            where: {
              read: false,
              senderId: { not: session.user.id },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const parsed = conversations.map((c) => ({
    ...c,
    listing: { ...c.listing, images: parseImages(c.listing.images) },
  }));

  return NextResponse.json(parsed);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { listingId } = await req.json();

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
  }

  if (listing.sellerId === session.user.id) {
    return NextResponse.json(
      { error: "No puedes contactarte contigo mismo" },
      { status: 400 }
    );
  }

  // Find or create conversation
  const existing = await prisma.conversation.findUnique({
    where: {
      buyerId_sellerId_listingId: {
        buyerId: session.user.id,
        sellerId: listing.sellerId,
        listingId,
      },
    },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const conversation = await prisma.conversation.create({
    data: {
      buyerId: session.user.id,
      sellerId: listing.sellerId,
      listingId,
    },
    include: {
      buyer: { select: { id: true, name: true, image: true } },
      seller: { select: { id: true, name: true, image: true } },
      listing: { select: { id: true, title: true, images: true, price: true } },
    },
  });

  return NextResponse.json({
    ...conversation,
    listing: { ...conversation.listing, images: parseImages(conversation.listing.images) },
  }, { status: 201 });
}
