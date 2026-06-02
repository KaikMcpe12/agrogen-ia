import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | undefined;
  required?: boolean;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({
  label,
  error,
  required,
  hint,
  leftIcon,
  rightIcon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[13px] font-medium text-ink-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          {...props}
          className={[
            "w-full px-3 py-[10px] rounded-[10px] border text-[14px] text-ink bg-surface",
            "placeholder:text-ink-4 transition-all outline-none",
            "focus:border-green-700 focus:ring-[3px] focus:ring-green-700/18",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-beige",
            error
              ? "border-danger focus:ring-danger/20"
              : "border-line",
            leftIcon ? "pl-10" : "",
            rightIcon ? "pr-10" : "",
            className,
          ].join(" ")}
          style={{ minHeight: 44 }}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-ink-4">
            {rightIcon}
          </span>
        )}
      </div>
      {hint && !error && (
        <p className="text-[12px] text-ink-3">{hint}</p>
      )}
      {error && (
        <p className="text-[12px] text-danger">{error}</p>
      )}
    </div>
  );
}
