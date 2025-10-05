import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer select-none disabled:cursor-default transition-all motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out hover:translate-y-[2px] active:translate-y-[2px] active:scale-100 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-[color:color-mix(in_srgb,var(--stroke)_40%,transparent)] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[rgba(255,255,255,0.9)] text-[var(--text)] border border-[var(--border)] shadow-xs hover:bg-[rgba(255,255,255,0.85)] hover:text-[var(--stroke)] hover:border-[var(--stroke)] hover:shadow-sm",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-[var(--border)] bg-[rgba(255,255,255,0.9)] shadow-xs hover:border-[var(--stroke)] hover:bg-[color:color-mix(in_srgb,var(--stroke)_15%,rgba(255,255,255,0.85))] hover:text-[var(--stroke)] dark:bg-input/30 dark:border-input",
        secondary:
          "bg-[rgba(255,255,255,0.9)] text-[var(--text)] shadow-xs hover:bg-[rgba(255,255,255,0.85)] hover:text-[var(--stroke)] hover:border-[var(--stroke)] hover:shadow-md border border-[var(--border)]",
        ghost:
          "hover:bg-[rgba(255,255,255,0.7)] hover:text-[var(--stroke)] dark:hover:bg-[color:color-mix(in_srgb,var(--stroke)_20%,transparent)] hover:shadow-sm",
  link: "text-[var(--stroke)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
