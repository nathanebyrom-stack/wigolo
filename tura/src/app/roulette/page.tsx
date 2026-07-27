import type { Metadata } from "next";

import { RouletteScreen } from "@/components/screens/roulette";

export const metadata: Metadata = {
  title: "Adventure roulette",
  description:
    "Set your limits, spin once, and go wherever it lands.",
};

export default function Page() {
  return <RouletteScreen />;
}
