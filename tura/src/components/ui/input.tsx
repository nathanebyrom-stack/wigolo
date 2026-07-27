import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input bg-background/70 placeholder:text-muted-foreground flex h-11 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-sm transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
        "file:text-foreground file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
