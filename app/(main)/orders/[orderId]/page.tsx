"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Package,
  Truck,
  CheckCircle,
  Loader2,
  MessageCircle,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import {
  formatPrice,
  formatDate,
  orderStatusLabel,
  orderStatusColor,
} from "@/lib/utils";

interface Order {
  id: string;
  status: string;
  totalPrice: number;
  basePrice: number;
  commissionAmount: number;
  commissionRate: number;
  trackingNumber?: string;
  createdAt: string;
  buyerId: string;
  sellerId: string;
  listing: {
    id: string;
    title: string;
    description: string;
    images: string[];
  };
  buyer: { id: string; name: string; email: string; avatar?: string };
  seller: { id: string; name: string; avatar?: string };
  review?: { id: string; rating: number; comment?: string };
  conversation?: { id: string };
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);
        setLoading(false);
      });
  }, [orderId]);

  const handleAction = async (action: string, extra?: Record<string, string>) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) {
        setOrder(await res.json());
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async () => {
    if (!order) return;
    setReviewSubmitting(true);
    try {
      const reviewedId =
        session?.user?.id === order.buyerId ? order.sellerId : order.buyerId;

      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          reviewedId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const updated = await fetch(`/api/orders/${orderId}`).then((r) => r.json());
      setOrder(updated);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sage-500" />
      </div>
    );
  }

  if (!order) return <div className="text-center py-12">Pedido no encontrado</div>;

  const isBuyer = session?.user?.id === order.buyerId;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedido</h1>
          <p className="text-sm text-gray-500 font-mono mt-0.5">#{order.id}</p>
        </div>
        <Badge
          variant={orderStatusColor(order.status) as "success" | "info" | "warning" | "danger" | "default"}
        >
          {orderStatusLabel(order.status)}
        </Badge>
      </div>

      {/* Listing summary */}
      <div className="card p-4 flex gap-4 mb-4">
        {order.listing.images[0] && (
          <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
            <Image
              src={order.listing.images[0]}
              alt={order.listing.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <Link
            href={`/listings/${order.listing.id}`}
            className="font-semibold text-gray-900 hover:text-sage-700"
          >
            {order.listing.title}
          </Link>

          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Precio del vendedor</span>
              <span className="text-gray-900">{formatPrice(order.basePrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Comisión Klader ({(Number(order.commissionRate) * 100).toFixed(1)}%)
              </span>
              <span className="text-earth-600">
                + {formatPrice(order.commissionAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-1.5">
              <span className="text-gray-900">Total pagado</span>
              <span className="text-sage-700">{formatPrice(order.totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-2">Comprador</p>
          <div className="flex items-center gap-2">
            {order.buyer.avatar ? (
              <Image src={order.buyer.avatar} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 text-xs font-semibold">
                {order.buyer.name[0]}
              </div>
            )}
            <span className="text-sm font-medium text-gray-900">{order.buyer.name}</span>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-2">Vendedor</p>
          <div className="flex items-center gap-2">
            {order.seller.avatar ? (
              <Image src={order.seller.avatar} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-earth-100 flex items-center justify-center text-earth-700 text-xs font-semibold">
                {order.seller.name[0]}
              </div>
            )}
            <span className="text-sm font-medium text-gray-900">{order.seller.name}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Acciones</h2>

        {order.conversation && (
          <Link
            href={`/messages/${order.conversation.id}`}
            className="btn-secondary w-full justify-center"
          >
            <MessageCircle className="h-4 w-4" />
            Ir al chat
          </Link>
        )}

        {/* Seller: mark as shipped */}
        {!isBuyer && order.status === "PAID" && (
          <div className="space-y-2">
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Número de seguimiento (opcional)"
              className="input-field"
            />
            <button
              onClick={() =>
                handleAction("ship", trackingInput ? { trackingNumber: trackingInput } : {})
              }
              disabled={actionLoading}
              className="btn-primary w-full justify-center"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              Marcar como enviado
            </button>
          </div>
        )}

        {/* Buyer: confirm delivery */}
        {isBuyer && order.status === "SHIPPED" && (
          <div>
            {order.trackingNumber && (
              <p className="text-sm text-gray-600 mb-3">
                Número de seguimiento:{" "}
                <span className="font-mono font-medium">{order.trackingNumber}</span>
              </p>
            )}
            <button
              onClick={() => handleAction("deliver")}
              disabled={actionLoading}
              className="btn-primary w-full justify-center"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Confirmar recepción
            </button>
          </div>
        )}

        {/* Review */}
        {order.status === "DELIVERED" && !order.review && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Dejar reseña
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1.5">Valoración</p>
                <StarRating
                  rating={reviewRating}
                  interactive
                  onChange={setReviewRating}
                  size="lg"
                />
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="input-field min-h-[80px] resize-y"
                placeholder="Comparte tu experiencia..."
                maxLength={1000}
              />
              <button
                onClick={handleReview}
                disabled={reviewSubmitting}
                className="btn-primary"
              >
                {reviewSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
                Publicar reseña
              </button>
            </div>
          </div>
        )}

        {order.review && (
          <div className="rounded-lg bg-sage-50 p-3">
            <p className="text-xs text-sage-600 font-medium mb-1">Reseña publicada</p>
            <StarRating rating={order.review.rating} />
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Pedido creado el {formatDate(order.createdAt)}
      </p>
    </div>
  );
}
