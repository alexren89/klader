"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface CommissionDisplayProps {
  basePrice: number;
  mode?: "buyer" | "seller" | "full";
  className?: string;
}

interface CommissionData {
  commissionRate: number;
  commissionAmount: number;
  totalBuyerPrice: number;
  sellerReceives: number;
  tierLabel: string;
}

export function CommissionDisplay({
  basePrice,
  mode = "full",
  className,
}: CommissionDisplayProps) {
  const [data, setData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!basePrice || basePrice <= 0) {
      setData(null);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/commissions/calculate?price=${basePrice}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // aborted
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [basePrice]);

  if (!basePrice || basePrice <= 0) return null;

  if (loading || !data) {
    return (
      <div className={`rounded-lg bg-sage-50 p-3 ${className || ""}`}>
        <div className="h-4 w-2/3 animate-pulse rounded bg-sage-200" />
      </div>
    );
  }

  if (mode === "seller") {
    return (
      <div className={`rounded-lg bg-sage-50 border border-sage-200 p-3 ${className || ""}`}>
        <p className="text-xs text-sage-600 font-medium">Recibirás</p>
        <p className="text-lg font-bold text-sage-700">
          {formatPrice(data.sellerReceives)}
        </p>
      </div>
    );
  }

  if (mode === "buyer") {
    return (
      <div className={`rounded-lg bg-earth-50 border border-earth-200 p-3 ${className || ""}`}>
        <p className="text-xs text-earth-600 font-medium">Pagarás</p>
        <p className="text-lg font-bold text-earth-700">
          {formatPrice(data.totalBuyerPrice)}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          + {formatPrice(data.commissionAmount)} comisión ({(data.commissionRate * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-gray-200 overflow-hidden ${className || ""}`}>
      <div className="bg-gray-50 px-4 py-2 flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-xs text-gray-500 font-medium">
          Desglose de precio · Tramo: {data.tierLabel}
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-sm text-gray-600">Precio del vendedor</span>
          <span className="text-sm font-medium text-gray-900">
            {formatPrice(data.sellerReceives)}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-sm text-gray-600">
            Comisión Klader ({(data.commissionRate * 100).toFixed(1)}%)
          </span>
          <span className="text-sm font-medium text-earth-600">
            + {formatPrice(data.commissionAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between bg-sage-50 px-4 py-2.5">
          <span className="text-sm font-semibold text-gray-900">Total comprador</span>
          <span className="text-base font-bold text-sage-700">
            {formatPrice(data.totalBuyerPrice)}
          </span>
        </div>
      </div>
    </div>
  );
}
