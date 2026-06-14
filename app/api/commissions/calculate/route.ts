import { NextResponse } from "next/server";
import { calculateCommission } from "@/lib/commission";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const price = parseFloat(searchParams.get("price") || "0");

  if (isNaN(price) || price < 0) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
  }

  const result = await calculateCommission(price);
  return NextResponse.json(result);
}
