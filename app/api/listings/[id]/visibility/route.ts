import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { sellerId: true, hidden: true },
  });

  if (!listing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (listing.sellerId !== session.user.id) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: { hidden: !listing.hidden },
    select: { hidden: true },
  });

  return NextResponse.json({ hidden: updated.hidden });
}
