"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatDate, orderStatusLabel, orderStatusColor } from "@/lib/utils";

interface Order {
  id: string;
  status: string;
  totalPrice: number;
  commissionAmount: number;
  basePrice: number;
  createdAt: string;
  buyer: { id: string; name: string; email: string };
  seller: { id: string; name: string };
  listing: { id: string; title: string };
  stripePaymentIntentId?: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [refunding, setRefunding] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      ...(statusFilter && { status: statusFilter }),
    });
    const res = await fetch(`/api/admin/orders?${params}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [statusFilter, page]);

  const handleRefund = async (orderId: string) => {
    if (!confirm("¿Procesar reembolso para este pedido?")) return;
    setRefunding(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "refund" }),
      });
      if (res.ok) fetchOrders();
    } finally {
      setRefunding(null);
    }
  };

  const STATUSES = ["", "PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} pedidos en total</p>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-sage-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-sage-300"
            }`}
          >
            {s ? orderStatusLabel(s) : "Todos"}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Pedido</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Artículo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Comprador</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Comisión</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Fecha</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-sage-500 mx-auto" />
                  </td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-gray-500">
                      #{order.id.slice(-8)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900 max-w-[150px] truncate">
                      {order.listing.title}
                    </p>
                    <p className="text-xs text-gray-400">{order.seller.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{order.buyer.name}</p>
                    <p className="text-xs text-gray-400">{order.buyer.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatPrice(order.totalPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-earth-600">
                    {formatPrice(order.commissionAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={orderStatusColor(order.status) as "success" | "info" | "warning" | "danger" | "default"}
                      size="sm"
                    >
                      {orderStatusLabel(order.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {["PAID", "SHIPPED"].includes(order.status) &&
                      order.stripePaymentIntentId && (
                        <button
                          onClick={() => handleRefund(order.id)}
                          disabled={refunding === order.id}
                          className="rounded p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                          title="Reembolsar"
                        >
                          {refunding === order.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Página {page} de {pages}</p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
              >
                ← Anterior
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
