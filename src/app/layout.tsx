import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";

import { landingContent } from "@/content/landing";
import { BottomNav } from "@/components/landing/bottom-nav";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans"
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-mono"
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${landingContent.brand.name} · ${landingContent.brand.tagline}`,
    template: `%s · ${landingContent.brand.name}`
  },
  description:
    "Salón de belleza con reservas en línea, atención personalizada y productos profesionales. Cortes, color y tratamientos capilares.",
  openGraph: {
    title: `${landingContent.brand.name} · ${landingContent.brand.tagline}`,
    description: "Reserva tu cita en línea y vive la experiencia del estudio.",
    url: appUrl,
    siteName: landingContent.brand.name,
    locale: "es_PE",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: landingContent.brand.name,
    description: landingContent.brand.tagline
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: landingContent.brand.name,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#c4587a",
  viewportFit: "cover",
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const className = `${inter.variable} ${cormorant.variable} ${jetbrainsMono.variable}`;

  return (
    <html lang="es" className={className}>
      <body>
        <div className="app-shell">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
