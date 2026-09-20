import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative inline-block w-full">
      <select
        ref={ref}
        className={cn(
          "h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-8 text-sm text-slate-900 shadow-sm transition-colors focus-visible:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20 disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
    </div>
  ),
);
Select.displayName = "Select";
