import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
        active
          ? "bg-primary text-on-primary shadow-card"
          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container",
        className
      )}
      {...props}
    />
  )
);
Chip.displayName = "Chip";

export { type ChipProps };
