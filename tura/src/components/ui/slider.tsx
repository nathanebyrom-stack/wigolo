"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const thumbCount = React.useMemo(
    () =>
      Array.isArray(value)
        ? value.length
        : Array.isArray(defaultValue)
          ? defaultValue.length
          : 1,
    [value, defaultValue],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="bg-secondary relative h-1.5 w-full grow overflow-hidden rounded-full"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="bg-primary absolute h-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, i) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={i}
          // The thumb carries role="slider", so the accessible name has to be
          // here rather than on the root.
          aria-label={
            thumbCount > 1 && ariaLabel
              ? `${ariaLabel}, handle ${i + 1}`
              : ariaLabel
          }
          className="border-primary bg-background focus-visible:outline-ring block size-5 shrink-0 rounded-full border-2 shadow-md transition-[color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
