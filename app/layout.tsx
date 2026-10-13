import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/session-provider";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://linkcommerce.cc"),
  title: {
    default: "LinkCommerce — Vende online em Angola",
    template: "%s | LinkCommerce",
  },
  description:
    "A plataforma de e-commerce feita para Angola. Cria a tua loja, gere pedidos, recebe com Multicaixa Express e vende online — sem código, em minutos.",
  keywords: [
    "loja online Angola",
    "e-commerce Angola",
    "vender online Angola",
    "Multicaixa Express",
    "criar loja online",
    "plataforma de vendas Angola",
    "LinkCommerce",
  ],
  authors: [{ name: "LinkCommerce", url: "https://linkcommerce.cc" }],
  creator: "LinkCommerce",
  publisher: "LinkCommerce",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "pt_AO",
    url: "https://linkcommerce.cc",
    siteName: "LinkCommerce",
    title: "LinkCommerce — Vende online em Angola",
    description:
      "A plataforma de e-commerce feita para Angola. Loja online, pagamentos Multicaixa, gestão de pedidos e muito mais.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LinkCommerce — Plataforma de e-commerce para Angola",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkCommerce — Vende online em Angola",
    description:
      "Plataforma de e-commerce feita para Angola. Cria a tua loja em minutos.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://linkcommerce.cc",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={montserrat.variable}>
      <body className="font-montserrat">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
