"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  PiggyBankIcon,
  PlusIcon,
  ReceiptIcon,
  TrashIcon,
} from "@phosphor-icons/react/ssr";

import { RefTag, TierDot } from "@/components/adventure/badges";
import { EXPENSE_ICON } from "@/components/adventure/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getAdventure } from "@/lib/adventures";
import { formatShortDate, formatSlotDate, slotBudget } from "@/lib/calendar";
import { money, moneyExact } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_LABEL,
  TIERS,
  TIER_META,
} from "@/lib/types";
import type { CalendarSlot, Expense, ExpenseCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BudgetScreen() {
  const { slotsFor, state, addExpense, deleteExpense, hydrated } = useStore();
  const today = React.useMemo(() => new Date(), []);
  const [year, setYear] = React.useState(today.getFullYear());
  const [formSlot, setFormSlot] = React.useState<CalendarSlot | null>(null);

  const slots = React.useMemo(() => slotsFor(year), [slotsFor, year]);
  const filledSlots = React.useMemo(
    () => slots.filter((slot) => slot.adventureId),
    [slots],
  );

  const expensesBySlot = React.useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const expense of state.expenses) {
      const list = map.get(expense.slotId);
      if (list) list.push(expense);
      else map.set(expense.slotId, [expense]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.date.localeCompare(a.date));
    }
    return map;
  }, [state.expenses]);

  const yearSlotIds = React.useMemo(
    () => new Set(slots.map((slot) => slot.id)),
    [slots],
  );

  const yearExpenses = React.useMemo(
    () => state.expenses.filter((expense) => yearSlotIds.has(expense.slotId)),
    [state.expenses, yearSlotIds],
  );

  const planned = filledSlots.reduce((sum, slot) => sum + slotBudget(slot), 0);
  const spent = yearExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = planned - spent;
  const percent = planned === 0 ? 0 : Math.min(100, Math.round((spent / planned) * 100));

  const byCategory = React.useMemo(() => {
    const totals = new Map<ExpenseCategory, number>();
    for (const expense of yearExpenses) {
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
    }
    return EXPENSE_CATEGORIES.map((category) => ({
      category,
      total: totals.get(category) ?? 0,
    })).filter((row) => row.total > 0);
  }, [yearExpenses]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Budget</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            What the year is planned to cost, against what it has.
          </p>
        </div>
        <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
          <SelectTrigger className="w-28" aria-label="Budget year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(
              (option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </header>

      <section
        aria-labelledby="totals-heading"
        className="bg-card mb-5 rounded-xl border p-4"
      >
        <h2 id="totals-heading" className="sr-only">
          Totals for {year}
        </h2>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Spent
            </p>
            <p className="text-3xl leading-none font-semibold tabular">
              {money(spent)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Planned
            </p>
            <p className="text-lg leading-none font-semibold tabular">
              {money(planned)}
            </p>
          </div>
        </div>

        <Progress
          value={percent}
          className="mt-4 h-2"
          indicatorClassName={cn(
            remaining < 0 ? "bg-destructive" : percent > 85 ? "bg-bracken" : "bg-primary",
          )}
          aria-label={`${percent} per cent of the ${year} plan spent`}
        />

        <p
          className={cn(
            "mt-2 text-sm",
            remaining < 0 ? "text-destructive font-medium" : "text-muted-foreground",
          )}
        >
          {planned === 0
            ? "Nothing planned yet — fill some calendar dates first."
            : remaining >= 0
              ? `${money(remaining)} left of the ${year} plan.`
              : `${money(Math.abs(remaining))} over the ${year} plan.`}
        </p>
      </section>

      <section aria-labelledby="tiers-heading" className="mb-5">
        <h2 id="tiers-heading" className="mb-2 text-sm font-semibold">
          By tier
        </h2>
        <ul className="grid grid-cols-3 gap-2">
          {TIERS.map((tier) => {
            const tierSlots = filledSlots.filter((slot) => slot.tier === tier);
            const tierPlanned = tierSlots.reduce(
              (sum, slot) => sum + slotBudget(slot),
              0,
            );
            const tierSpent = yearExpenses
              .filter((expense) =>
                tierSlots.some((slot) => slot.id === expense.slotId),
              )
              .reduce((sum, expense) => sum + expense.amount, 0);

            return (
              <li key={tier} className="bg-card rounded-lg border p-3">
                <div className="flex items-center gap-1.5">
                  <TierDot tier={tier} />
                  <span className="text-xs font-semibold">
                    {TIER_META[tier].label}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold tabular">
                  {money(tierSpent)}
                </p>
                <p className="text-muted-foreground text-[0.6875rem] tabular">
                  of {money(tierPlanned)}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {byCategory.length > 0 && (
        <section aria-labelledby="categories-heading" className="mb-5">
          <h2 id="categories-heading" className="mb-2 text-sm font-semibold">
            Where it went
          </h2>
          <ul className="bg-card divide-y rounded-xl border">
            {byCategory.map(({ category, total }) => {
              const Icon = EXPENSE_ICON[category];
              return (
                <li
                  key={category}
                  className="flex items-center gap-3 px-3.5 py-2.5"
                >
                  <Icon className="text-muted-foreground size-4 shrink-0" />
                  <span className="flex-1 text-sm">{EXPENSE_LABEL[category]}</span>
                  <span className="text-sm font-medium tabular">
                    {money(total)}
                  </span>
                  <span className="text-muted-foreground w-10 text-right text-xs tabular">
                    {spent === 0 ? "0%" : `${Math.round((total / spent) * 100)}%`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="trips-heading">
        <h2 id="trips-heading" className="mb-3 text-lg font-semibold">
          Trip by trip
        </h2>

        {hydrated && filledSlots.length === 0 ? (
          <div className="bg-card rounded-xl border p-6 text-center">
            <PiggyBankIcon className="text-muted-foreground mx-auto size-8" />
            <p className="mt-3 text-sm font-medium">Nothing to track yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Book an adventure into a date and it will appear here.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/calendar">Open the calendar</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {filledSlots.map((slot) => {
              const adventure = getAdventure(slot.adventureId as string);
              if (!adventure) return null;

              const expenses = expensesBySlot.get(slot.id) ?? [];
              const slotSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
              const budget = slotBudget(slot);
              const slotPercent =
                budget === 0 ? 0 : Math.min(100, Math.round((slotSpent / budget) * 100));

              return (
                <li key={slot.id} className="bg-card rounded-xl border">
                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <TierDot tier={slot.tier} />
                          <RefTag refCode={adventure.ref} />
                          <span className="text-muted-foreground text-xs">
                            {formatSlotDate(slot.date)}
                          </span>
                        </div>
                        <Link
                          href={`/adventure/${adventure.id}`}
                          className="focus-visible:outline-ring mt-0.5 block truncate text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                          {adventure.title}
                        </Link>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular">
                          {money(slotSpent)}
                        </p>
                        <p className="text-muted-foreground text-xs tabular">
                          of {money(budget)}
                        </p>
                      </div>
                    </div>

                    <Progress
                      value={slotPercent}
                      className="mt-3 h-1"
                      indicatorClassName={
                        slotSpent > budget ? "bg-destructive" : "bg-primary"
                      }
                      aria-label={`${adventure.ref}: ${slotPercent} per cent of budget spent`}
                    />

                    {expenses.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {expenses.map((expense) => {
                          const Icon = EXPENSE_ICON[expense.category];
                          return (
                            <li
                              key={expense.id}
                              className="group flex items-center gap-2.5 text-sm"
                            >
                              <Icon className="text-muted-foreground size-3.5 shrink-0" />
                              <span className="min-w-0 flex-1 truncate">
                                {expense.label}
                              </span>
                              <span className="text-muted-foreground shrink-0 text-xs tabular">
                                {formatShortDate(expense.date)}
                              </span>
                              <span className="shrink-0 font-medium tabular">
                                {moneyExact(expense.amount)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteExpense(expense.id);
                                  toast(`Removed “${expense.label}”`);
                                }}
                                aria-label={`Delete expense ${expense.label}`}
                                className="text-muted-foreground hover:text-destructive focus-visible:outline-ring shrink-0 rounded p-1 transition-colors focus-visible:outline-2"
                              >
                                <TrashIcon className="size-3.5" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 -ml-2"
                      onClick={() => setFormSlot(slot)}
                    >
                      <PlusIcon className="size-4" />
                      Add an expense
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ExpenseSheet
        slot={formSlot}
        onOpenChange={(open) => !open && setFormSlot(null)}
        onSubmit={(expense) => {
          addExpense(expense);
          toast.success(`${moneyExact(expense.amount)} logged`);
          setFormSlot(null);
        }}
      />
    </div>
  );
}

function ExpenseSheet({
  slot,
  onOpenChange,
  onSubmit,
}: {
  slot: CalendarSlot | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (expense: Omit<Expense, "id" | "createdAt">) => void;
}) {
  return (
    <Sheet open={slot !== null} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        {/* Keyed on the slot so each trip opens a blank form. */}
        {slot && <ExpenseForm key={slot.id} slot={slot} onSubmit={onSubmit} />}
      </SheetContent>
    </Sheet>
  );
}

function ExpenseForm({
  slot,
  onSubmit,
}: {
  slot: CalendarSlot;
  onSubmit: (expense: Omit<Expense, "id" | "createdAt">) => void;
}) {
  const [label, setLabel] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState<ExpenseCategory>("travel");
  const [date, setDate] = React.useState(slot.date);

  const parsed = Number.parseFloat(amount);
  const valid = label.trim().length > 0 && Number.isFinite(parsed) && parsed > 0;

  const adventure = slot.adventureId ? getAdventure(slot.adventureId) : undefined;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;
        onSubmit({
          slotId: slot.id,
          adventureId: slot.adventureId,
          label: label.trim(),
          amount: Math.round(parsed * 100) / 100,
          category,
          date,
        });
      }}
      className="space-y-4"
    >
      <SheetHeader>
        <SheetTitle>Add an expense</SheetTitle>
        <SheetDescription>
          {adventure ? `${adventure.ref} — ${adventure.title}` : "This trip"}
          {" · "}
          {formatSlotDate(slot.date)}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-2">
        <Label htmlFor="expense-label">What was it?</Label>
        <Input
          id="expense-label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Diesel, Wasdale return"
          required
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="expense-amount">Amount</Label>
          <Input
            id="expense-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expense-date">Date</Label>
          <Input
            id="expense-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expense-category">Category</Label>
        <Select
          value={category}
          onValueChange={(value) => setCategory(value as ExpenseCategory)}
        >
          <SelectTrigger id="expense-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((option) => (
              <SelectItem key={option} value={option}>
                {EXPENSE_LABEL[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={!valid} className="w-full">
        <ReceiptIcon className="size-4" />
        Log it
      </Button>
    </form>
  );
}
