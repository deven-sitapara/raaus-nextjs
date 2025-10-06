import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  suffix?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, required, helpText, suffix, ...props }, ref) => {
    return (
      <div className="w-full" style={{marginBottom: '10px'}}>
        {label && (
          <label className="block text-base font-medium text-black mb-1" style={{fontSize: '16px', color: '#000000', marginBottom: '10px'}}>
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500 focus:ring-red-500",
              suffix && "pr-12",
              className
            )}
            ref={ref}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
              {suffix}
            </span>
          )}
        </div>
        {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
