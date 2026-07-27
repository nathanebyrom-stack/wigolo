import type { Metadata } from "next";

import { StatsScreen } from "@/components/screens/stats";

export const metadata: Metadata = {
  title: "Statistics",
  description:
    "Nights away, miles covered, spend against plan, and how far through the catalogue you are.",
};

export default function Page() {
  return <StatsScreen />;
}
