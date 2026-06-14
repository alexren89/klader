"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartData {
  date: string;
  sales: number;
  commission: number;
}

export function DashboardCharts({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            `$${value.toFixed(2)}`,
            name === "sales" ? "Ventas" : "Comisiones",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
        <Legend
          formatter={(value) => (value === "sales" ? "Ventas" : "Comisiones")}
        />
        <Bar
          dataKey="sales"
          fill="#7f9e80"
          radius={[4, 4, 0, 0]}
          name="sales"
        />
        <Bar
          dataKey="commission"
          fill="#c09b6b"
          radius={[4, 4, 0, 0]}
          name="commission"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
