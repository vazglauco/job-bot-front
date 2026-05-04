import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientShell } from "@/components/client-shell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Job Bot",
  description: "Dashboard de vagas — multi-user job pipeline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased font-sans`}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}

