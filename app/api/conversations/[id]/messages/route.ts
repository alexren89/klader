import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { sendNewMessageEmail } from "@/lib/resend";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
  messageType: z.enum(["text", "offer"]).default("text"),
  offerAmount: z.number().positive().optional(),
});

// Rate limiting simple (in-memory, production should use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const window = 60 * 1000; // 1 minute
  const maxMessages = 30;

  const current = rateLimitMap.get(userId);
  if (!current || current.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + window });
    return true;
  }
  if (current.count >= maxMessages) return false;
  current.count++;
  return true;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
  }

  if (
    conversation.buyerId !== session.user.id &&
    conversation.sellerId !== session.user.id
  ) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: params.id },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Mark messages as read
  await prisma.message.updateMany({
    where: {
      conversationId: params.id,
      senderId: { not: session.user.id },
      read: false,
    },
    data: { read: true },
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json(
      { error: "Demasiados mensajes. Espera un momento." },
      { status: 429 }
    );
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      listing: { select: { title: true } },
      buyer: { select: { email: true, name: true } },
      seller: { select: { email: true, name: true } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
  }

  if (
    conversation.buyerId !== session.user.id &&
    conversation.sellerId !== session.user.id
  ) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { content, messageType, offerAmount } = messageSchema.parse(body);

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: session.user.id,
        content,
        messageType,
        offerAmount: offerAmount ?? null,
        offerStatus: messageType === "offer" ? "pending" : null,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    // Pusher event (non-blocking — fails gracefully if not configured)
    pusherServer.trigger(`conversation-${params.id}`, "new-message", message).catch(() => {});

    // Email notification (non-blocking)
    const recipientId =
      session.user.id === conversation.buyerId
        ? conversation.sellerId
        : conversation.buyerId;

    const recipient =
      session.user.id === conversation.buyerId
        ? conversation.seller
        : conversation.buyer;

    const sender = session.user.name || "Alguien";

    if (recipient.email) {
      sendNewMessageEmail({
        to: recipient.email,
        senderName: sender,
        listingTitle: conversation.listing.title,
        conversationId: params.id,
      }).catch(console.error);
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 });
  }
}
