import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transformListing } from "@/lib/db-helpers";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const listing = await prisma.listing.findUnique({
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
          _count: { select: { listings: true } },
        },
      },
      _count: { select: { favorites: true } },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
  }

  // Increment views
  await prisma.listing.update({
    where: { id: params.id },
    data: { views: { increment: 1 } },
  });

  return NextResponse.json(transformListing(listing));
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
  });

  if (!listing) {
    return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
  }

  if (listing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json();

  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: body,
    include: {
      seller: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
  });

  if (!listing) {
    return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
  }

  if (listing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  await prisma.listing.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
