"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Package, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatDate, orderStatusLabel, orderStatusColor } from "@/lib/utils";

interface Order {
  id: string;
  status: string;
  totalPrice: number;
  basePrice: number;
  commissionAmount: number;
  createdAt: string;
  buyerId: string;
  listing: { id: string; title: string; images: string[] };
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  review?: { id: string };
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"buying" | "selling">("buying");

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  const buyingOrders = orders.filter((o) => o.buyerId === session?.user?.id);
  const sellingOrders = orders.filter((o) => o.buyerId !== session?.user?.id);
  const displayOrders = tab === "buying" ? buyingOrders : sellingOrders;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis pedidos</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("buying")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "buying"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Comprando ({buyingOrders.length})
        </button>
        <button
          onClick={() => setTab("selling")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "selling"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Vendiendo ({sellingOrders.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-sage-500" />
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">
            {tab === "buying"
              ? "No has realizado ninguna compra todavía"
              : "No has vendido nada todavía"}
          </p>
          {tab === "buying" && (
            <Link href="/browse" className="btn-primary mt-4 inline-flex">
              Explorar artículos
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayOrders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow block"
            >
              {order.listing.images[0] ? (
                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <Image
                    src={order.listing.images[0]}
                    alt={order.listing.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-2xl">
                  👗
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {order.listing.title}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {tab === "buying" ? `Vendedor: ${order.seller.name}` : `Comprador: ${order.buyer.name}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900">{formatPrice(order.totalPrice)}</p>
                <div className="mt-1">
                  <Badge
                    variant={orderStatusColor(order.status) as "success" | "info" | "warning" | "danger" | "default"}
                    size="sm"
                  >
                    {orderStatusLabel(order.status)}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
