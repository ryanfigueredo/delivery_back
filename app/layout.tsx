import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Pedidos Express - Sistema de Delivery",
  description: "Sistema completo de automação para delivery via WhatsApp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
