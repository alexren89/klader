import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "Ahora mismo";
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
  if (seconds < 2592000) return `Hace ${Math.floor(seconds / 86400)} días`;
  return formatDate(date);
}

export function conditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    NEW: "Nuevo",
    LIKE_NEW: "Como nuevo",
    GOOD: "Buen estado",
    FAIR: "Aceptable",
  };
  return labels[condition] || condition;
}

export function conditionColor(condition: string): string {
  const colors: Record<string, string> = {
    NEW: "success",
    LIKE_NEW: "success",
    GOOD: "info",
    FAIR: "warning",
  };
  return colors[condition] || "default";
}

export function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    PAID: "Pagado",
    SHIPPED: "Enviado",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
    REFUNDED: "Reembolsado",
  };
  return labels[status] || status;
}

export function orderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "warning",
    PAID: "info",
    SHIPPED: "info",
    DELIVERED: "success",
    CANCELLED: "danger",
    REFUNDED: "danger",
  };
  return colors[status] || "default";
}
