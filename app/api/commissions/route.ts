import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateCommission } from "@/lib/commission";
import { z } from "zod";

export async function GET() {
  const tiers = await prisma.commissionTier.findMany({
    orderBy: { minPrice: "asc" },
  });
  return NextResponse.json(tiers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const schema = z.object({
    label: z.string().min(1),
    minPrice: z.number().min(0),
    maxPrice: z.number().positive().nullable(),
    rate: z.number().min(0.001).max(1),
  });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const tier = await prisma.commissionTier.create({
      data: {
        ...data,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json(tier, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
