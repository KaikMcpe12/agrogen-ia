import { NavLink } from "react-router-dom";
import { LayoutDashboard, PawPrint, Syringe, BookOpen, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Drawer } from "./Drawer";

const PRIMARY_TABS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/animais", label: "Animais", icon: PawPrint },
  { to: "/inseminacao", label: "Inseminação", icon: Syringe },
  { to: "/diario-de-bordo", label: "Diário", icon: BookOpen },
];

const MORE_ITEMS = [
  { to: "/analise-ia", label: "Análise IA" },
  { to: "/relatorios", label: "Relatórios" },
];

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-surface/95 backdrop-blur-md border-t border-line pb-safe">
        <div className="flex items-stretch h-16">
          {PRIMARY_TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors min-h-[44px]",
                  isActive ? "text-ink" : "text-ink-3",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
          {/* More button */}
          <button
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-ink-4 min-h-[44px]"
            onClick={() => setMoreOpen(true)}
          >
            <MoreHorizontal size={20} />
            <span>Mais</span>
          </button>
        </div>
      </nav>

      <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title="Mais opções" side="right">
        <div className="flex flex-col gap-2">
          {MORE_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                [
                  "px-4 py-3 rounded-[12px] text-[15px] font-medium transition-colors border",
                  isActive
                    ? "bg-green-100 text-green-900 border-green-200"
                    : "bg-surface text-ink border-line hover:bg-beige",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </Drawer>
    </>
  );
}
