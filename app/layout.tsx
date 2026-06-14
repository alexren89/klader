import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Klader - Moda de segunda mano",
    template: "%s | Klader",
  },
  description:
    "Compra y vende ropa de segunda mano de forma sostenible. Encuentra moda única a precios increíbles.",
  keywords: ["ropa segunda mano", "moda sostenible", "vinted", "klader"],
  openGraph: {
    title: "Klader - Moda de segunda mano",
    description: "Compra y vende ropa de segunda mano de forma sostenible.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
