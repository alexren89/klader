"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { CommissionDisplay } from "@/components/commission/CommissionDisplay";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise =
  stripeKey && stripeKey !== "pk_test_..."
    ? loadStripe(stripeKey)
    : null;

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  seller: { name: string };
}

function CheckoutForm({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setError("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}`,
      },
    });

    if (error) {
      setError(error.message || "Error al procesar el pago");
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={paying || !stripe}
        className="btn-primary w-full justify-center py-3"
      >
        {paying ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        Pagar de forma segura
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        Pago seguro con Stripe · SSL
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const { listingId } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      // Fetch listing
      const listingRes = await fetch(`/api/listings/${listingId}`);
      if (!listingRes.ok) {
        setError("Artículo no encontrado");
        setLoading(false);
        return;
      }
      const listingData = await listingRes.json();
      setListing(listingData);

      // Create order & payment intent
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json();
        setError(data.error || "Error al crear el pedido");
        setLoading(false);
        return;
      }

      const { orderId: oid, clientSecret: cs } = await orderRes.json();
      setOrderId(oid);
      setClientSecret(cs);
      setLoading(false);
    };

    init();
  }, [listingId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sage-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/browse" className="btn-primary">
          Volver a explorar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <Link
        href={`/listings/${listingId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al artículo
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Completar compra</h1>

      {listing && (
        <div className="card p-4 mb-6 flex items-center gap-3">
          {listing.images[0] && (
            <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              <Image
                src={listing.images[0]}
                alt={listing.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{listing.title}</p>
            <p className="text-sm text-gray-500">Vendedor: {listing.seller.name}</p>
          </div>
        </div>
      )}

      {listing && (
        <div className="mb-6">
          <CommissionDisplay
            basePrice={Number(listing.price)}
            mode="full"
          />
        </div>
      )}

      {clientSecret && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Información de pago</h2>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#4a674b",
                  fontFamily: "Inter, system-ui, sans-serif",
                  borderRadius: "8px",
                },
              },
            }}
          >
            <CheckoutForm
              orderId={orderId}
              onSuccess={() => router.push(`/orders/${orderId}`)}
            />
          </Elements>
        </div>
      )}
    </div>
  );
}
