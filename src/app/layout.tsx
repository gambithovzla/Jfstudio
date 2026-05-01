import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { landingContent } from "@/content/landing";

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
    "Salon de belleza con reservas en linea, atencion personalizada y productos profesionales. Cortes, color y tratamientos capilares.",
  openGraph: {
    title: `${landingContent.brand.name} · ${landingContent.brand.tagline}`,
    description: "Reserva tu cita en linea y vive la experiencia del estudio.",
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
  icons: {
    icon: "/favicon.ico"
  }
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
      </body>
    </html>
  );
}
