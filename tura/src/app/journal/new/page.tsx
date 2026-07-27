import { Suspense } from "react";
import type { Metadata } from "next";

import { JournalFormScreen } from "@/components/screens/journal-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Write it up",
  description: "Record what happened, with photographs and a rating.",
};

export default function Page() {
  return (
    // useSearchParams needs a Suspense boundary so the shell can still be
    // prerendered while the query string is read on the client.
    <Suspense fallback={<FormSkeleton />}>
      <JournalFormScreen />
    </Suspense>
  );
}

function FormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
