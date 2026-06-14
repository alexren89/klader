import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { action, role } = await req.json();

  if (action === "suspend") {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { suspended: true },
    });
    return NextResponse.json(user);
  }

  if (action === "unsuspend") {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { suspended: false },
    });
    return NextResponse.json(user);
  }

  if (action === "changeRole" && role) {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { role },
    });
    return NextResponse.json(user);
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
