'use client';

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { fieldClasses } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function PasswordField(
  props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
    label?: string;
  },
) {
  const { label, className, ...inputProps } = props;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[var(--navy-950)]">
      {label ? <span>{label}</span> : null}
      <span className="relative">
        <input
          {...inputProps}
          type={isVisible ? "text" : "password"}
          className={cn(fieldClasses, "pr-14", className)}
        />
        <button
          type="button"
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((value) => !value)}
          className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full p-1 text-[var(--ink-500)] transition hover:text-[var(--navy-950)] focus:outline-none focus:ring-2 focus:ring-[rgba(244,71,161,0.24)]"
        >
          {isVisible ? (
            <EyeOff aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Eye aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
      </span>
    </label>
  );
}
