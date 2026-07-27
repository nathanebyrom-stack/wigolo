import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input bg-background/70 placeholder:text-muted-foreground flex min-h-24 w-full rounded-md border px-3 py-2 text-base shadow-sm transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
