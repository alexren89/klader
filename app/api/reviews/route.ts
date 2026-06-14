import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  orderId: z.string(),
  reviewedId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderId, reviewedId, rating, comment } = reviewSchema.parse(body);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Solo puedes reseñar pedidos entregados" },
        { status: 400 }
      );
    }

    if (order.buyerId !== session.user.id && order.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const existing = await prisma.review.findFirst({
      where: { orderId, reviewerId: session.user.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya has dejado una reseña para este pedido" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: session.user.id,
        reviewedId,
        orderId,
        rating,
        comment,
      },
    });

    // Update user rating
    const reviews = await prisma.review.findMany({
      where: { reviewedId },
      select: { rating: true },
    });

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.user.update({
      where: { id: reviewedId },
      data: { rating: Math.round(avgRating * 10) / 10 },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear reseña" }, { status: 500 });
  }
}
