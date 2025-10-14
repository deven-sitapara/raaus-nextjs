import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, onCheckedChange, ...props }, ref) => {
    const checkboxId = props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="w-full">
        <div className="flex items-center">
          <label htmlFor={checkboxId} className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              id={checkboxId}
              className={cn(
                "h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer",
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
              <span className="ml-2 text-sm font-medium text-gray-700 select-none">
                {label}
              </span>
            )}
          </label>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
