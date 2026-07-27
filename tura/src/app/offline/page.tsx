import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Offline",
  description: "TURA works without a signal — this page just has not been cached yet.",
};

export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center py-16 text-center">
      <h1 className="text-2xl font-semibold">No signal, and no cached copy</h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        Everything you have already opened still works offline — the catalogue,
        your calendar, the budget and the journal are all on the device. This
        particular page has not been visited yet, so there is nothing stored for
        it.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/">Back to the map</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/calendar">Calendar</Link>
        </Button>
      </div>
    </div>
  );
}
