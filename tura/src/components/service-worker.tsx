"use client";

import * as React from "react";

/**
 * Registers the offline service worker.
 *
 * Kept out of the main bundle path deliberately: registration is fire and
 * forget, and a failure here must never break the app.
 */
export function ServiceWorker() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Offline support is a bonus; the app works without it.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
