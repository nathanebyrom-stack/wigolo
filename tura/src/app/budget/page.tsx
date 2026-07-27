import type { Metadata } from "next";

import { BudgetScreen } from "@/components/screens/budget";

export const metadata: Metadata = {
  title: "Budget",
  description: "Planned against actual spend, trip by trip and tier by tier.",
};

export default function Page() {
  return <BudgetScreen />;
}
