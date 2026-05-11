import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EV Charge Pulse",
    short_name: "Charge Pulse",
    description: "Realtime EV charging tracker · mobile-first.",
    lang: "en",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    start_url: "/dashboard?utm_source=pwa",
    background_color: "#0b1324",
    theme_color: "#0b1324",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
