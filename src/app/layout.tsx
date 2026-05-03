import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { landingContent } from "@/content/landing";
import { BottomNav } from "@/components/landing/bottom-nav";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display"
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
  const className = `${inter.variable} ${playfair.variable}`;

  return (
    <html lang="es" className={className}>
      <body>
        <div className="app-shell">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
