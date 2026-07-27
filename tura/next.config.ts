import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives inside a larger repo that has its own lockfile; pin the root
  // so Turbopack does not walk up and pick the wrong one.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  // The floating dev badge sits on top of the bottom tab bar on a phone-sized
  // viewport, which makes the nav impossible to test.
  devIndicators: false,
  async headers() {
    return [
      {
        // The service worker must never be served from a stale HTTP cache, or
        // the app cannot ship an update.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
