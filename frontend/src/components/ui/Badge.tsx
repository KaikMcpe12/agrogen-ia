import type { ReactNode } from "react";

type BadgeVariant =
  | "bovino"
  | "ovino"
  | "caprino"
  | "ok"
  | "warn"
  | "danger"
  | "ghost"
  | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  bovino: "bg-green-100 text-green-900",
  ovino: "bg-terra-200 text-terra-900",
  caprino: "bg-amber-bg text-amber",
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  danger: "bg-danger-bg text-danger",
  ghost: "bg-beige text-ink-2",
  info: "bg-green-100 text-green-700",
};

export function Badge({ variant = "ghost", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-[10px] py-[3px] rounded-full",
        "text-[12px] font-semibold",
        variantStyles[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
