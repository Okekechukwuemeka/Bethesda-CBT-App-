import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bethesda CBT App",
    short_name: "Bethesda CBT",
    description: "Offline-capable computer-based testing app",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a1de4",
    icons: [
      { src: "/icons/logo-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/logo-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/logo-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
