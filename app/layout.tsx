import type { Metadata } from "next";
import "./globals.css";
import { EVENT } from "@/lib/event";

export const metadata: Metadata = {
  title: `${EVENT.name} — ${EVENT.sub}`,
  description: `Ingressos para o ${EVENT.name}, ${EVENT.date} em ${EVENT.local}.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
