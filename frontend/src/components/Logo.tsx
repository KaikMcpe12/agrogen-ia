import { useId } from "react";

interface LogoProps {
  variant?: "full" | "icon-only";
  size?: number;
  className?: string;
}

function BovineIcon({ size = 36 }: { size?: number }) {
  const gradId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Circuit base */}
      <rect width="36" height="36" rx="10" fill={`url(#${gradId})`} />
      {/* Bovine head outline */}
      <path
        d="M11 10 Q11 7 14 7 L15 9 M25 10 Q25 7 22 7 L21 9"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 15 Q10 11 18 11 Q26 11 26 15 L26 22 Q26 27 18 27 Q10 27 10 22 Z"
        fill="rgba(255,255,255,0.15)"
        stroke="white"
        strokeWidth="1.5"
      />
      {/* Eyes */}
      <circle cx="14.5" cy="17" r="1.5" fill="white" />
      <circle cx="21.5" cy="17" r="1.5" fill="white" />
      {/* Nose */}
      <ellipse cx="18" cy="22.5" rx="3.5" ry="2" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1" />
      <circle cx="16.5" cy="22.5" r="0.7" fill="white" />
      <circle cx="19.5" cy="22.5" r="0.7" fill="white" />
      {/* Circuit dots */}
      <circle cx="6" cy="18" r="1" fill="rgba(255,255,255,0.5)" />
      <circle cx="30" cy="18" r="1" fill="rgba(255,255,255,0.5)" />
      <line x1="7" y1="18" x2="10" y2="18" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <line x1="26" y1="18" x2="29" y2="18" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1B4332" />
          <stop offset="1" stopColor="#40916C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({ variant = "full", size = 36, className = "" }: LogoProps) {
  if (variant === "icon-only") {
    return <BovineIcon size={size} />;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <BovineIcon size={size} />
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: size * 0.56,
          fontWeight: 700,
          color: "var(--color-ink)",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          display: "flex",
          alignItems: "center",
          gap: "0.25em",
        }}
      >
        <span>AgroGen</span>
        <span
          style={{
            color: "var(--color-amber)",
            fontWeight: 800,
          }}
        >
          IA
        </span>
      </div>
    </div>
  );
}
