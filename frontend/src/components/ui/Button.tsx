import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "amber" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-green-900 text-white hover:bg-green-800 focus-visible:ring-green-700/35",
  amber: "bg-amber text-[#2A1F00] hover:opacity-90 focus-visible:ring-amber/35",
  secondary: "bg-surface text-ink-2 border border-line hover:bg-beige focus-visible:ring-green-700/35",
  ghost: "bg-transparent text-ink-2 hover:bg-beige focus-visible:ring-green-700/35",
  danger: "bg-danger text-white hover:opacity-90 focus-visible:ring-danger/35",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-[10px] py-[6px] text-[13px] rounded-[8px] min-h-[32px]",
  md: "px-[18px] py-[10px] text-[14px] rounded-[10px] min-h-[44px]",
  lg: "px-6 py-3 text-[15px] rounded-[10px] min-h-[52px]",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled ?? loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center gap-2 font-semibold transition-all",
        "focus-visible:outline-none focus-visible:ring-[3px]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "hover:not-disabled:-translate-y-px hover:not-disabled:shadow-md",
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(" ")}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
