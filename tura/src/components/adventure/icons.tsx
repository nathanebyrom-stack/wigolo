import {
  BedIcon,
  BoatIcon,
  CampfireIcon,
  CarIcon,
  DropIcon,
  ForkKnifeIcon,
  MountainsIcon,
  PersonSimpleHikeIcon,
  PersonSimpleSwimIcon,
  SailboatIcon,
  ShoppingBagIcon,
  TentIcon,
  TicketIcon,
  TreeIcon,
  WavesIcon,
} from "@phosphor-icons/react/ssr";

import type { Category, ExpenseCategory } from "@/lib/types";

type IconComponent = React.ComponentType<{
  className?: string;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
}>;

export const CATEGORY_ICON: Record<Category, IconComponent> = {
  camping: TentIcon,
  coast: WavesIcon,
  mountains: MountainsIcon,
  forest: TreeIcon,
  lakes: DropIcon,
  hiking: PersonSimpleHikeIcon,
  kayaking: BoatIcon,
  sailing: SailboatIcon,
  "wild-swimming": PersonSimpleSwimIcon,
  bushcraft: CampfireIcon,
};

export const EXPENSE_ICON: Record<ExpenseCategory, IconComponent> = {
  travel: CarIcon,
  stay: BedIcon,
  food: ForkKnifeIcon,
  kit: ShoppingBagIcon,
  activity: TicketIcon,
  other: DropIcon,
};
