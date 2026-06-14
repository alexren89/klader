import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      location: true,
      clothingSize: true,
      shoeSize: true,
      rating: true,
      totalSales: true,
      createdAt: true,
      listings: {
        where: { status: "ACTIVE", NOT: { hidden: true } },
        include: {
          seller: { select: { id: true, name: true, image: true, rating: true } },
          _count: { select: { favorites: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      receivedReviews: {
        include: {
          reviewer: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.id !== params.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { name, bio, location, image, clothingSize, shoeSize } = await req.json();

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      ...(bio !== undefined && { bio }),
      ...(location !== undefined && { location }),
      ...(image && { image }),
      ...(clothingSize !== undefined && { clothingSize: clothingSize || null }),
      ...(shoeSize !== undefined && { shoeSize: shoeSize || null }),
    },
  });

  return NextResponse.json(user);
}
