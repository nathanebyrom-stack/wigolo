import type { Adventure, Category } from "./types";

export interface ChecklistItem {
  id: string;
  label: string;
  group: ChecklistGroup;
}

export type ChecklistGroup = "book" | "pack" | "prep" | "leave";

export const CHECKLIST_GROUPS: {
  id: ChecklistGroup;
  label: string;
  description: string;
}[] = [
  { id: "book", label: "Book", description: "Anything that needs paying for or reserving" },
  { id: "prep", label: "Prepare", description: "Route, weather, tides, permits" },
  { id: "pack", label: "Pack", description: "Kit that has to be in the car" },
  { id: "leave", label: "Before you leave", description: "The last hour at home" },
];

/** Every adventure gets these. */
const UNIVERSAL: Omit<ChecklistItem, "id">[] = [
  { label: "Agree the date and block it out with both employers", group: "book" },
  { label: "Check the forecast three days out and again the night before", group: "prep" },
  { label: "Download offline maps for the area", group: "prep" },
  { label: "Tell one person the route and expected return time", group: "prep" },
  { label: "First aid kit checked and restocked", group: "pack" },
  { label: "Both phones charged, plus a power bank", group: "pack" },
  { label: "Water bottles filled", group: "leave" },
  { label: "Bins out, heating down, plants watered", group: "leave" },
];

/** Extra items for adventures with at least one night away. */
const OVERNIGHT: Omit<ChecklistItem, "id">[] = [
  { label: "Book the pitch, cabin or bothy", group: "book" },
  { label: "Sleeping bags aired and rated for the forecast low", group: "pack" },
  { label: "Stove, gas and enough food for every meal", group: "pack" },
  { label: "Head torch each, with spare batteries", group: "pack" },
];

/** The full two-night, adults-only escape. */
const UNINTERRUPTED: Omit<ChecklistItem, "id">[] = [
  { label: "Out-of-office on, notifications off, both of you", group: "prep" },
  { label: "Second night's plan agreed, so nobody is deciding at 6pm", group: "prep" },
  { label: "Something decent to drink, and two glasses that are not plastic", group: "pack" },
];

const BY_CATEGORY: Partial<Record<Category, Omit<ChecklistItem, "id">[]>> = {
  camping: [
    { label: "Tent pitched and checked at home first", group: "prep" },
    { label: "Pegs suited to the ground — rock pegs if it is thin soil", group: "pack" },
  ],
  coast: [{ label: "Tide times printed or screenshotted", group: "prep" }],
  mountains: [
    { label: "Paper map and compass, not just the phone", group: "pack" },
    { label: "Route card written, with an escape route off each summit", group: "prep" },
  ],
  forest: [{ label: "Midge net and repellent between June and September", group: "pack" }],
  lakes: [{ label: "Check launch permits and access rules for the water", group: "book" }],
  hiking: [{ label: "Boots worn in, and blister plasters packed", group: "pack" }],
  kayaking: [
    { label: "Buoyancy aids fitted to each of you", group: "pack" },
    { label: "Dry bags for phones, keys and a spare layer", group: "pack" },
  ],
  sailing: [
    { label: "Confirm the charter or club booking", group: "book" },
    { label: "Check wind forecast and the tidal window", group: "prep" },
  ],
  "wild-swimming": [
    { label: "Tow float, and a hot drink in a flask for afterwards", group: "pack" },
    { label: "Check water temperature and entry and exit points", group: "prep" },
  ],
  bushcraft: [
    { label: "Confirm fires are permitted, or plan for stove only", group: "prep" },
    { label: "Firesteel, tinder and a folding saw", group: "pack" },
  ],
};

/**
 * Build the checklist for an adventure.
 *
 * Ids are derived from the adventure and a stable index, so a ticked item stays
 * ticked across reloads and app updates as long as the catalogue entry is the
 * same.
 */
export function buildChecklist(adventure: Adventure): ChecklistItem[] {
  const items: Omit<ChecklistItem, "id">[] = [...UNIVERSAL];

  if (adventure.nights > 0) items.push(...OVERNIGHT);
  if (adventure.nights >= 2 && adventure.adultsOnly) items.push(...UNINTERRUPTED);

  const seen = new Set(items.map((i) => i.label));
  for (const category of adventure.categories) {
    for (const item of BY_CATEGORY[category] ?? []) {
      if (!seen.has(item.label)) {
        seen.add(item.label);
        items.push(item);
      }
    }
  }

  // Adventure-specific kit notes become their own pack items.
  for (const kit of adventure.kit) {
    if (!seen.has(kit)) {
      seen.add(kit);
      items.push({ label: kit, group: "pack" });
    }
  }

  const order: ChecklistGroup[] = ["book", "prep", "pack", "leave"];
  return items
    .map((item, index) => ({ ...item, id: `${adventure.id}:${index}` }))
    .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
}

export function checklistProgress(
  items: ChecklistItem[],
  checked: string[],
): { done: number; total: number; percent: number } {
  const set = new Set(checked);
  const done = items.filter((i) => set.has(i.id)).length;
  const total = items.length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}
