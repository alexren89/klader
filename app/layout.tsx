import type { Metadata } from "next";
import { Unbounded, Schibsted_Grotesk, Martian_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const displayFont = Unbounded({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const monoFont = Martian_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Klader — Moda de segunda mano",
    template: "%s | Klader",
  },
  description:
    "Compra y vende ropa de segunda mano de forma sostenible. Encuentra moda única a precios increíbles.",
  keywords: ["ropa segunda mano", "moda sostenible", "vinted", "klader"],
  openGraph: {
    title: "Klader — Moda de segunda mano",
    description: "Compra y vende ropa de segunda mano de forma sostenible.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
