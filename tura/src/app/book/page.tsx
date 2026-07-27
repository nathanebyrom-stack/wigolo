import type { Metadata } from "next";

import { BookScreen } from "@/components/screens/book";

export const metadata: Metadata = {
  title: "The adventure book",
  description:
    "A page for every completed adventure, in the order it happened.",
};

export default function Page() {
  return <BookScreen />;
}
