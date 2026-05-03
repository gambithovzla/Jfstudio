import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JF Studio",
    short_name: "JF Studio",
    description: "Salón de belleza con reservas en línea — Miraflores, Lima",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#c4587a",
    orientation: "portrait-primary",
    lang: "es",
    categories: ["beauty", "lifestyle"],
    icons: [
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/pwa-icon", sizes: "512x512", type: "image/png", purpose: "maskable any" },
    ],
  };
}
