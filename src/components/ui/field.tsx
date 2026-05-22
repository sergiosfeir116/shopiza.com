import { cn } from "@/lib/utils";

export const fieldClasses =
  "w-full rounded-2xl border border-[var(--line-soft)] bg-white px-4 py-3 text-sm text-[var(--navy-950)] shadow-[0_8px_18px_rgba(17,24,39,0.04)] outline-none placeholder:text-[var(--ink-500)] focus:border-[rgba(244,71,161,0.48)] focus:ring-4 focus:ring-[rgba(244,71,161,0.12)]";

export function TextField(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string },
) {
  const { label, className, ...inputProps } = props;

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[var(--navy-950)]">
      {label ? <span>{label}</span> : null}
      <input className={cn(fieldClasses, className)} {...inputProps} />
    </label>
  );
}

export function TextAreaField(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string },
) {
  const { label, className, ...textareaProps } = props;

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[var(--navy-950)]">
      {label ? <span>{label}</span> : null}
      <textarea
        className={cn(fieldClasses, "min-h-[140px] resize-y", className)}
        {...textareaProps}
      />
    </label>
  );
}

export function SelectField(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string },
) {
  const { label, className, children, ...selectProps } = props;

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[var(--navy-950)]">
      {label ? <span>{label}</span> : null}
      <select className={cn(fieldClasses, className)} {...selectProps}>
        {children}
      </select>
    </label>
  );
}
