import { prisma } from "./prisma";

export interface CommissionCalculation {
  commissionRate: number;
  commissionAmount: number;
  totalBuyerPrice: number;
  sellerReceives: number;
  tierLabel: string;
}

export async function calculateCommission(
  basePrice: number
): Promise<CommissionCalculation> {
  const tiers = await prisma.commissionTier.findMany({
    orderBy: { minPrice: "asc" },
  });

  const applicableTier = tiers.find((tier) => {
    const min = Number(tier.minPrice);
    const max = tier.maxPrice !== null ? Number(tier.maxPrice) : Infinity;
    return basePrice >= min && basePrice <= max;
  });

  if (!applicableTier) {
    // Fallback: use highest tier
    const lastTier = tiers[tiers.length - 1];
    if (!lastTier) {
      return {
        commissionRate: 0.05,
        commissionAmount: basePrice * 0.05,
        totalBuyerPrice: basePrice * 1.05,
        sellerReceives: basePrice,
        tierLabel: "Estándar",
      };
    }
    const rate = Number(lastTier.rate);
    const commissionAmount = Math.round(basePrice * rate * 100) / 100;
    return {
      commissionRate: rate,
      commissionAmount,
      totalBuyerPrice: Math.round((basePrice + commissionAmount) * 100) / 100,
      sellerReceives: basePrice,
      tierLabel: lastTier.label,
    };
  }

  const rate = Number(applicableTier.rate);
  const commissionAmount = Math.round(basePrice * rate * 100) / 100;

  return {
    commissionRate: rate,
    commissionAmount,
    totalBuyerPrice: Math.round((basePrice + commissionAmount) * 100) / 100,
    sellerReceives: basePrice,
    tierLabel: applicableTier.label,
  };
}

export function calculateCommissionSync(
  basePrice: number,
  tiers: Array<{
    minPrice: number | string;
    maxPrice: number | string | null;
    rate: number | string;
    label: string;
  }>
): CommissionCalculation {
  const sorted = [...tiers].sort(
    (a, b) => Number(a.minPrice) - Number(b.minPrice)
  );

  const applicableTier = sorted.find((tier) => {
    const min = Number(tier.minPrice);
    const max = tier.maxPrice !== null ? Number(tier.maxPrice) : Infinity;
    return basePrice >= min && basePrice <= max;
  });

  const tier = applicableTier ?? sorted[sorted.length - 1];

  if (!tier) {
    const rate = 0.05;
    const commissionAmount = Math.round(basePrice * rate * 100) / 100;
    return {
      commissionRate: rate,
      commissionAmount,
      totalBuyerPrice: Math.round((basePrice + commissionAmount) * 100) / 100,
      sellerReceives: basePrice,
      tierLabel: "Estándar",
    };
  }

  const rate = Number(tier.rate);
  const commissionAmount = Math.round(basePrice * rate * 100) / 100;

  return {
    commissionRate: rate,
    commissionAmount,
    totalBuyerPrice: Math.round((basePrice + commissionAmount) * 100) / 100,
    sellerReceives: basePrice,
    tierLabel: tier.label,
  };
}

export function validateTiers(
  tiers: Array<{
    minPrice: number;
    maxPrice: number | null;
    rate: number;
    label: string;
  }>
): { valid: boolean; error?: string } {
  const sorted = [...tiers].sort((a, b) => a.minPrice - b.minPrice);

  for (let i = 0; i < sorted.length; i++) {
    const tier = sorted[i];
    if (tier.minPrice < 0) {
      return { valid: false, error: "El precio mínimo no puede ser negativo" };
    }
    if (tier.maxPrice !== null && tier.maxPrice <= tier.minPrice) {
      return {
        valid: false,
        error: `El precio máximo debe ser mayor que el mínimo en el tramo "${tier.label}"`,
      };
    }
    if (tier.rate <= 0 || tier.rate > 1) {
      return {
        valid: false,
        error: `La tasa de comisión debe estar entre 0 y 100% en el tramo "${tier.label}"`,
      };
    }
    if (i > 0) {
      const prev = sorted[i - 1];
      if (prev.maxPrice === null) {
        return {
          valid: false,
          error: "Solo el último tramo puede no tener precio máximo",
        };
      }
      const expectedMin = prev.maxPrice + 0.01;
      if (Math.abs(tier.minPrice - expectedMin) > 0.02) {
        return {
          valid: false,
          error: `Hay un hueco o superposición entre los tramos "${prev.label}" y "${tier.label}"`,
        };
      }
    }
  }

  const lastTier = sorted[sorted.length - 1];
  if (lastTier && lastTier.maxPrice !== null) {
    return {
      valid: false,
      error: "El último tramo debe tener precio máximo vacío (sin límite)",
    };
  }

  return { valid: true };
}
