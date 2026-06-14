import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, stripeConfigured, formatAmountForStripe } from "@/lib/stripe";
import { calculateCommission } from "@/lib/commission";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { buyerId: session.user.id },
        { sellerId: session.user.id },
      ],
    },
    include: {
      buyer: { select: { id: true, name: true, avatar: true } },
      seller: { select: { id: true, name: true, avatar: true } },
      listing: { select: { id: true, title: true, images: true } },
      review: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { listingId, shippingAddress } = await req.json();

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { seller: true },
  });

  if (!listing || listing.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Artículo no disponible" },
      { status: 400 }
    );
  }

  if (listing.sellerId === session.user.id) {
    return NextResponse.json(
      { error: "No puedes comprar tu propio artículo" },
      { status: 400 }
    );
  }

  const basePrice = Number(listing.price);
  const commission = await calculateCommission(basePrice);

  if (!stripeConfigured) {
    return NextResponse.json(
      { error: "Pagos no configurados. Añade tus claves de Stripe en .env.local para habilitar el checkout." },
      { status: 503 }
    );
  }

  // Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: formatAmountForStripe(commission.totalBuyerPrice),
    currency: "clp",
    metadata: {
      listingId,
      buyerId: session.user.id,
      sellerId: listing.sellerId,
    },
  });

  // Create order in PENDING state
  const order = await prisma.order.create({
    data: {
      buyerId: session.user.id,
      sellerId: listing.sellerId,
      listingId,
      basePrice,
      commissionRate: commission.commissionRate,
      commissionAmount: commission.commissionAmount,
      totalPrice: commission.totalBuyerPrice,
      stripePaymentIntentId: paymentIntent.id,
      shippingAddress,
      status: "PENDING",
    },
  });

  // Reserve listing
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "RESERVED" },
  });

  return NextResponse.json({
    orderId: order.id,
    clientSecret: paymentIntent.client_secret,
    commission,
  });
}
