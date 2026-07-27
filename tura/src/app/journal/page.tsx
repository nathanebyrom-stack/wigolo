import type { Metadata } from "next";

import { JournalScreen } from "@/components/screens/journal";

export const metadata: Metadata = {
  title: "Journal",
  description: "Memories, photographs and ratings from every adventure taken.",
};

export default function Page() {
  return <JournalScreen />;
}
