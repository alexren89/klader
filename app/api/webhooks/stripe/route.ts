import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/resend";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const order = await prisma.order.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: {
        buyer: { select: { email: true, name: true } },
        listing: { select: { title: true } },
      },
    });

    if (order && order.status === "PENDING") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });

      if (order.buyer.email) {
        sendOrderConfirmationEmail({
          to: order.buyer.email,
          buyerName: order.buyer.name || "Comprador",
          listingTitle: order.listing.title,
          totalPrice: Number(order.totalPrice),
          orderId: order.id,
        }).catch(console.error);
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const order = await prisma.order.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: { listing: true },
    });

    if (order) {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        }),
        prisma.listing.update({
          where: { id: order.listingId },
          data: { status: "ACTIVE" },
        }),
      ]);
    }
  }

  return NextResponse.json({ received: true });
}
