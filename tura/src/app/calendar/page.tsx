import type { Metadata } from "next";

import { CalendarScreen } from "@/components/screens/calendar";

export const metadata: Metadata = {
  title: "Calendar",
  description:
    "Nineteen dates a year: green on the last Saturday of every month, amber mid-month every other month, and one red birthday adventure.",
};

export default function Page() {
  return <CalendarScreen />;
}
