import type { Metadata } from "next";
import "./globals.css";
import AppNavbar from "@/components/layout/app-navbar";

export const metadata: Metadata = {
  title: "BDO DRC - Gestion des références",
  description: "Portail de gestion des numéros de référence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>
        <AppNavbar />
        {children}
      </body>
    </html>
  );
}