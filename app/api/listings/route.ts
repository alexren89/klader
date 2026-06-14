import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateCommission } from "@/lib/commission";
import { transformListings, serializeImages } from "@/lib/db-helpers";
import { z } from "zod";

const createListingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  price: z.number().positive().max(10000000),
  condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR"]),
  size: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  images: z.array(z.string().url()).min(1).max(8),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const category = searchParams.get("category");
  const condition = searchParams.get("condition");
  const size = searchParams.get("size");
  const brand = searchParams.get("brand");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "recent";
  const sellerId = searchParams.get("sellerId");

  const session = await getServerSession(authOptions);
  const viewerIsOwner = sellerId && session?.user?.id === sellerId;

  const where: Record<string, unknown> = {
    ...(sellerId
      ? {
          sellerId,
          // Owner can see all their own listings; others cannot see hidden ones
          ...(!viewerIsOwner && { NOT: { hidden: true } }),
        }
      : {
          status: "ACTIVE",
          NOT: { hidden: true },
          // Exclude listings from users in vacation mode
          seller: { NOT: { vacationMode: true } },
        }),
    ...(category && { category }),
    ...(condition && { condition }),
    ...(size && { size }),
    ...(brand && { brand: { contains: brand } }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) }),
      },
    }),
    ...(search && {
      OR: [
        { title: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } },
      ],
    }),
  };

  const orderBy: Record<string, string> =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
      ? { price: "desc" }
      : sort === "views"
      ? { views: "desc" }
      : { createdAt: "desc" };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        seller: { select: { id: true, name: true, avatar: true, rating: true } },
        _count: { select: { favorites: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({
    listings: transformListings(listings),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.emailVerified) {
    return NextResponse.json(
      { error: "Debes verificar tu email para publicar artículos" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = createListingSchema.parse(body);

    const commission = await calculateCommission(data.price);

    const listing = await prisma.listing.create({
      data: {
        ...data,
        images: serializeImages(data.images),
        sellerId: session.user.id,
      },
      include: {
        seller: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ ...listing, images: data.images, commission }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Create listing error:", error);
    return NextResponse.json(
      { error: "Error al crear el artículo" },
      { status: 500 }
    );
  }
}
