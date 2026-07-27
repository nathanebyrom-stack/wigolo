"use client";

import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/lib/store";
import { ServiceWorker } from "./service-worker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <StoreProvider>
        {children}
        <ServiceWorker />
        <Toaster />
      </StoreProvider>
    </ThemeProvider>
  );
}
