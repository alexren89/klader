import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
export const stripe = new Stripe(key && key !== "sk_test_..." ? key : "sk_test_placeholder_not_configured", {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

export const stripeConfigured = !!(key && key !== "sk_test_...");

export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}
