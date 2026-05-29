import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Bell, ChevronDown, Moon, Sun, User, Menu } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/hooks/useTheme";
import { AlertDrawer } from "./AlertDrawer";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/animais", label: "Animais" },
  { to: "/inseminacao", label: "Inseminação" },
  { to: "/analise-ia", label: "Análise IA", highlight: true },
  { to: "/diario-de-bordo", label: "Diário de Bordo" },
  { to: "/relatorios", label: "Relatórios" },
];

interface HeaderProps {
  alertCount?: number;
  onMenuToggle?: () => void;
}

export function Header({ alertCount = 0, onMenuToggle }: HeaderProps) {
  const { isDark, toggle } = useTheme();
  const [alertDrawerOpen, setAlertDrawerOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-line"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <div className="max-w-[1440px] mx-auto px-4 h-16 flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige"
            onClick={onMenuToggle}
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <NavLink to="/dashboard" className="shrink-0">
            <Logo size={32} />
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "px-3 py-2 rounded-[10px] text-[14px] font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-green-100 text-white"
                      : "text-ink-3 hover:text-ink hover:bg-beige",
                    item.highlight && !isActive
                      ? "text-green-700 font-semibold"
                      : "",
                  ].join(" ")
                }
              >
                {item.label}
                {item.highlight && (
                  <span className="ml-1 text-[10px] font-bold bg-amber-soft text-amber px-1 py-0.5 rounded">
                    IA
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* Alert bell */}
            <button
              className="relative w-10 h-10 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige transition-colors"
              onClick={() => setAlertDrawerOpen(true)}
              aria-label={`Alertas${alertCount > 0 ? ` (${alertCount} não lidos)` : ""}`}
            >
              <Bell size={18} />
              {alertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </button>

            {/* Dark mode toggle */}
            <button
              className="w-10 h-10 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige transition-colors"
              onClick={toggle}
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User avatar */}
            <button className="flex items-center gap-2 px-3 py-2 rounded-[10px] hover:bg-beige transition-colors">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                style={{ background: "linear-gradient(135deg, #8B5E3C, #B98E6A)" }}
              >
                <User size={14} />
              </div>
              <ChevronDown size={14} className="text-ink-4 hidden sm:block" />
            </button>
          </div>
        </div>
      </header>

      <AlertDrawer open={alertDrawerOpen} onClose={() => setAlertDrawerOpen(false)} />
    </>
  );
}
