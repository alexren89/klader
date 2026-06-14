import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const schema = z.object({
    label: z.string().min(1).optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().positive().nullable().optional(),
    rate: z.number().min(0.001).max(1).optional(),
  });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const tier = await prisma.commissionTier.update({
      where: { id: params.id },
      data: { ...data, updatedBy: session.user.id },
    });

    return NextResponse.json(tier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.commissionTier.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
