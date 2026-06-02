import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "sm" | "md" | "lg";
}

const paddingMap = { sm: "p-4", md: "p-5", lg: "p-6" };

export function Card({ children, padding = "md", className = "", ...props }: CardProps) {
  return (
    <div
      {...props}
      className={[
        "bg-surface border border-line rounded-[18px]",
        "shadow-[var(--shadow-sm)]",
        paddingMap[padding],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
