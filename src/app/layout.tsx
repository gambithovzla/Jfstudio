import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";

export const metadata: Metadata = {
  title: "JF Studio",
  description: "Agenda, clientes, inventario y caja para salon de belleza."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const content = <div className="app-shell">{children}</div>;

  return (
    <html lang="es">
      <body>{hasClerk ? <ClerkProvider>{content}</ClerkProvider> : content}</body>
    </html>
  );
}
