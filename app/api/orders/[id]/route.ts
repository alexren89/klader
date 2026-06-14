import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      buyer: { select: { id: true, name: true, avatar: true, email: true } },
      seller: { select: { id: true, name: true, avatar: true } },
      listing: { select: { id: true, title: true, images: true, description: true } },
      review: true,
      conversation: { select: { id: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (
    order.buyerId !== session.user.id &&
    order.sellerId !== session.user.id &&
    session.user.role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { listing: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const { action, trackingNumber } = await req.json();

  if (action === "ship" && order.sellerId === session.user.id) {
    if (order.status !== "PAID") {
      return NextResponse.json({ error: "El pedido no está pagado" }, { status: 400 });
    }
    const updated = await prisma.order.update({
      where: { id: params.id },
      data: { status: "SHIPPED", trackingNumber },
    });
    return NextResponse.json(updated);
  }

  if (action === "deliver" && order.buyerId === session.user.id) {
    if (order.status !== "SHIPPED") {
      return NextResponse.json({ error: "El pedido no ha sido enviado" }, { status: 400 });
    }
    const updated = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: params.id },
        data: { status: "DELIVERED" },
      });
      await tx.listing.update({
        where: { id: order.listingId },
        data: { status: "SOLD" },
      });
      await tx.user.update({
        where: { id: order.sellerId },
        data: { totalSales: { increment: 1 } },
      });
      return o;
    });
    return NextResponse.json(updated);
  }

  if (action === "cancel") {
    if (
      order.buyerId !== session.user.id &&
      order.sellerId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    if (!["PENDING", "PAID"].includes(order.status)) {
      return NextResponse.json({ error: "No se puede cancelar este pedido" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: params.id },
        data: { status: "CANCELLED" },
      });
      await tx.listing.update({
        where: { id: order.listingId },
        data: { status: "ACTIVE" },
      });
      return o;
    });

    // Refund if paid
    if (order.status === "PAID" && order.stripePaymentIntentId) {
      await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
      });
      await prisma.order.update({
        where: { id: params.id },
        data: { status: "REFUNDED" },
      });
    }

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
