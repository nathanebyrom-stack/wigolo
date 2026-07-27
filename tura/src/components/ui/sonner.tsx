"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Toasts, themed from the app's own CSS variables so they never render as a
 * white card over the dark map.
 */
export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={(resolvedTheme as ToasterProps["theme"]) ?? "dark"}
      position="top-center"
      offset="calc(env(safe-area-inset-top, 0px) + 4rem)"
      mobileOffset="calc(env(safe-area-inset-top, 0px) + 4rem)"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !shadow-xl",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--popover)",
          "--success-text": "var(--primary)",
          "--success-border": "var(--border)",
          "--error-bg": "var(--popover)",
          "--error-text": "var(--destructive)",
          "--error-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
