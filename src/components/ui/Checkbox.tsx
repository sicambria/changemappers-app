
import * as React from "react"

const Checkbox = React.forwardRef<
    HTMLInputElement,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
        onCheckedChange?: (checked: boolean) => void
    }
>(({ className: _className, checked, onCheckedChange, ...props }, ref) => {
    // Custom checkbox implementation using simple input for MVP or custom div
    // Using standard checkbox hidden + styled label usually, or simpler:
    return (
        <label className="flex items-center space-x-2 cursor-pointer">
            <input
                type="checkbox"
                className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 accent-primary"
                ref={ref}
                checked={checked as boolean}
                onChange={(e) => onCheckedChange?.(e.target.checked)}
                {...props}
            />
        </label>
    )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
