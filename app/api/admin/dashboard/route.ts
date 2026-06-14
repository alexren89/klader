import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subDays, format } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    activeListings,
    totalUsers,
    monthlyOrders,
    allTimeOrders,
    recentDailyStats,
  ] = await Promise.all([
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.order.findMany({
      where: {
        status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: { totalPrice: true, commissionAmount: true },
    }),
    prisma.order.findMany({
      where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
      select: { totalPrice: true, commissionAmount: true },
    }),
    // Last 30 days
    prisma.order.findMany({
      where: {
        status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: subDays(now, 30) },
      },
      select: { createdAt: true, totalPrice: true, commissionAmount: true },
    }),
  ]);

  const monthlySales = monthlyOrders.reduce(
    (sum, o) => sum + Number(o.totalPrice),
    0
  );
  const monthlyCommission = monthlyOrders.reduce(
    (sum, o) => sum + Number(o.commissionAmount),
    0
  );
  const totalRevenue = allTimeOrders.reduce(
    (sum, o) => sum + Number(o.commissionAmount),
    0
  );

  // Build daily chart data for last 30 days
  const dailyMap = new Map<string, { sales: number; commission: number }>();
  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(now, i), "yyyy-MM-dd");
    dailyMap.set(date, { sales: 0, commission: 0 });
  }

  for (const order of recentDailyStats) {
    const date = format(order.createdAt, "yyyy-MM-dd");
    if (dailyMap.has(date)) {
      const existing = dailyMap.get(date)!;
      existing.sales += Number(order.totalPrice);
      existing.commission += Number(order.commissionAmount);
    }
  }

  const chartData = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    sales: Math.round(data.sales * 100) / 100,
    commission: Math.round(data.commission * 100) / 100,
  }));

  return NextResponse.json({
    activeListings,
    totalUsers,
    monthlyOrders: monthlyOrders.length,
    monthlySales: Math.round(monthlySales * 100) / 100,
    monthlyCommission: Math.round(monthlyCommission * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    chartData,
  });
}
