import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TURA — adventure planner for two",
    short_name: "TURA",
    description:
      "A mobile-first adventure planner for two adults. Camping, coast, mountains, forests and lakes — three quarters of it within reach of a Friday evening.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c130f",
    theme_color: "#0c130f",
    categories: ["travel", "lifestyle", "productivity"],
    lang: "en-GB",
    dir: "ltr",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-256.png", sizes: "256x256", type: "image/png" },
      { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Adventure roulette",
        short_name: "Roulette",
        description: "Spin for the next one",
        url: "/roulette",
      },
      {
        name: "Calendar",
        short_name: "Calendar",
        description: "The nineteen dates for this year",
        url: "/calendar",
      },
      {
        name: "Write it up",
        short_name: "Journal",
        description: "Record what happened",
        url: "/journal/new",
      },
    ],
  };
}
