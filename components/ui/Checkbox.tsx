import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, onCheckedChange, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="flex items-center">
          <input
            type="checkbox"
            className={cn(
              "h-4 w-4 rounded border-gray-300 text-blue-600",
              "focus:ring-2 focus:ring-blue-500 focus:ring-offset-0",
              error && "border-red-500",
              className
            )}
            ref={ref}
            onChange={(e) => {
              props.onChange?.(e);
              onCheckedChange?.(e.target.checked);
            }}
            {...props}
          />
          {label && (
            <label htmlFor={props.id} className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
              {label}
            </label>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
