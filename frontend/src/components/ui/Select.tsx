import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | undefined;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  required,
  options,
  placeholder,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-[13px] font-medium text-ink-2"
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          {...props}
          className={[
            "w-full appearance-none px-3 py-[10px] pr-9 rounded-[10px] border text-[14px] text-ink bg-surface",
            "transition-all outline-none cursor-pointer",
            "focus:border-green-700 focus:ring-[3px] focus:ring-green-700/18",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-beige",
            error ? "border-danger" : "border-line",
            className,
          ].join(" ")}
          style={{ minHeight: 44 }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none"
        />
      </div>
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}
