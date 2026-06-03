interface LogoProps {
  variant?: "full" | "icon-only";
  size?: number;
  className?: string;
}

function BovineIcon({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.278),
        flexShrink: 0,
        background: "#ffffff",
        boxShadow: "inset 0 0 0 1px #d8e9df",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        overflow: "hidden",
      }}
    >
      <img
        src="/logo.svg"
        alt=""
        aria-hidden="true"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
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
          fontSize: Math.min(size * 0.56, 16),
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
