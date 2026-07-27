"use client";

import { StarIcon } from "@phosphor-icons/react/ssr";

import { cn } from "@/lib/utils";

/** Read-only star display for feeds and the adventure book. */
export function RatingStars({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className={cn("text-bracken inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className="size-3.5"
          weight={star <= value ? "fill" : "regular"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/** Interactive rating input, wired as a radiogroup. */
export function RatingInput({
  value,
  onChange,
  id,
}: {
  value: number;
  onChange: (value: number) => void;
  id?: string;
}) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label="How was it?"
      className="flex items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} out of 5`}
          onClick={() => onChange(star)}
          className={cn(
            "focus-visible:outline-ring rounded-md p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
            star <= value ? "text-bracken" : "text-muted-foreground/40",
          )}
        >
          <StarIcon
            className="size-7"
            weight={star <= value ? "fill" : "regular"}
          />
        </button>
      ))}
    </div>
  );
}
