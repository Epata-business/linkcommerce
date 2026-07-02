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
  title: "LinkCommerce — Crie a sua loja online",
  description: "Crie, personalize e venda com a sua loja online em minutos. Sem código. Sem complicações.",
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
