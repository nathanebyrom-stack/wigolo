import type { Metadata } from "next";

import { SettingsScreen } from "@/components/screens/settings";

export const metadata: Metadata = {
  title: "Settings",
  description: "Names, birthday, home point, map style and your local data.",
};

export default function Page() {
  return <SettingsScreen />;
}
