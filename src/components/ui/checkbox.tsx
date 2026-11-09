import * as React from "react"
import { Check } from "lucide-react"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", checked = false, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <label
        className={`relative inline-flex items-center justify-center select-none ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only peer"
          {...props}
        />
        <div
          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
            checked
              ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs dark:bg-emerald-500 dark:border-emerald-500"
              : "border-slate-400/80 bg-background hover:border-emerald-500 dark:border-slate-600"
          } ${className}`}
        >
          {checked && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

