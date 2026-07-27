import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdventureDetail } from "@/components/screens/adventure-detail";
import { ADVENTURES, getAdventure } from "@/lib/adventures";

/** The catalogue is static, so every adventure page is prerendered at build. */
export function generateStaticParams() {
  return ADVENTURES.map((adventure) => ({ id: adventure.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const adventure = getAdventure(id);

  if (!adventure) return { title: "Adventure not found" };

  return {
    title: `${adventure.ref} — ${adventure.title}`,
    description: adventure.summary,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adventure = getAdventure(id);

  if (!adventure) notFound();

  return <AdventureDetail adventure={adventure} />;
}
