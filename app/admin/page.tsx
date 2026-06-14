import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { DashboardCharts } from "./DashboardCharts";
import { Package, Users, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "sage",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color?: "sage" | "earth" | "blue" | "purple";
}) {
  const colors = {
    sage: "bg-sage-50 text-sage-600",
    earth: "bg-earth-50 text-earth-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className={`rounded-xl p-2.5 ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [activeListings, totalUsers, monthlyOrders, chartData] = await Promise.all([
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.order.findMany({
      where: {
        status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: { totalPrice: true, commissionAmount: true, createdAt: true },
    }),
    // Last 7 days chart
    prisma.order.findMany({
      where: {
        status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: { totalPrice: true, commissionAmount: true, createdAt: true },
    }),
  ]);

  const monthlySales = monthlyOrders.reduce((s, o) => s + Number(o.totalPrice), 0);
  const monthlyCommission = monthlyOrders.reduce(
    (s, o) => s + Number(o.commissionAmount),
    0
  );

  // Build daily data
  const days = 7;
  const dailyMap = new Map<string, { sales: number; commission: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toLocaleDateString("es-ES", { weekday: "short" });
    dailyMap.set(key, { sales: 0, commission: 0 });
  }

  for (const o of chartData) {
    const key = new Date(o.createdAt).toLocaleDateString("es-ES", { weekday: "short" });
    if (dailyMap.has(key)) {
      const d = dailyMap.get(key)!;
      d.sales += Number(o.totalPrice);
      d.commission += Number(o.commissionAmount);
    }
  }

  const chartPoints = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    sales: Math.round(data.sales * 100) / 100,
    commission: Math.round(data.commission * 100) / 100,
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {now.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <StatCard
          title="Artículos activos"
          value={activeListings}
          icon={Package}
          color="sage"
        />
        <StatCard
          title="Usuarios registrados"
          value={totalUsers}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Ventas del mes"
          value={`$${monthlySales.toFixed(0)}`}
          subtitle={`${monthlyOrders.length} pedidos`}
          icon={ShoppingCart}
          color="earth"
        />
        <StatCard
          title="Comisiones del mes"
          value={`$${monthlyCommission.toFixed(2)}`}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Chart */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Ventas últimos 7 días
        </h2>
        <DashboardCharts data={chartPoints} />
      </div>
    </div>
  );
}
