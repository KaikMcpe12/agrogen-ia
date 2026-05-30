import { NavLink, useNavigate } from "react-router-dom";
import { Home, PawPrint, Syringe, BookOpen, Menu, User, LogOut, BarChart2, Brain } from "lucide-react";
import { useState } from "react";
import { Drawer } from "./Drawer";
import { STORAGE_KEYS } from "@/lib/storage-keys";

// Adendo 9.7: 5 itens fixos, ícones conforme especificação
const PRIMARY_TABS = [
  { to: "/dashboard",     label: "Início",     icon: Home },
  { to: "/animais",       label: "Animais",    icon: PawPrint },
  { to: "/inseminacao",   label: "Inseminação", icon: Syringe },
  { to: "/diario-de-bordo", label: "Diário",   icon: BookOpen },
];

const MORE_NAV_ITEMS = [
  { to: "/analise-ia",  label: "Análise IA",  icon: Brain },
  { to: "/relatorios",  label: "Relatórios",  icon: BarChart2 },
  { to: "/perfil",      label: "Perfil",      icon: User },
];

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setMoreOpen(false);
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.fazendaAtivaId);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    void navigate("/login");
  };

  return (
    <>
      <nav
        className="md:hidden shrink-0 z-30 bg-surface border-t border-line"
        aria-label="Navegação principal"
      >
        <div className="flex items-stretch h-16">
          {PRIMARY_TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              aria-label={label}
              className={({ isActive }) =>
                [
                  "flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors min-h-[44px]",
                  isActive ? "text-green-700" : "text-ink-3",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={[
                      "w-9 h-7 flex items-center justify-center rounded-[10px] transition-colors",
                      isActive ? "bg-green-700/10" : "",
                    ].join(" ")}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Mais button */}
          <button
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-ink-3 min-h-[44px] transition-colors hover:text-ink"
            onClick={() => setMoreOpen(true)}
            aria-label="Mais opções de navegação"
          >
            <div className="w-9 h-7 flex items-center justify-center">
              <Menu size={20} strokeWidth={1.8} />
            </div>
            <span>Mais</span>
          </button>
        </div>
      </nav>

      <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title="Menu" side="bottom">
        <div className="flex flex-col gap-1.5">
          {MORE_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-4 py-3 rounded-[12px] text-[15px] font-medium transition-colors border",
                  isActive
                    ? "bg-green-100 text-green-900 border-green-700/20"
                    : "bg-surface text-ink border-line hover:bg-beige",
                ].join(" ")
              }
            >
              <Icon size={18} className="shrink-0" />
              {label}
            </NavLink>
          ))}

          <div className="border-t border-line my-1" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-[15px] font-medium text-danger hover:bg-danger-bg transition-colors border border-transparent"
          >
            <LogOut size={18} className="shrink-0" />
            Sair
          </button>
        </div>
      </Drawer>
    </>
  );
}
