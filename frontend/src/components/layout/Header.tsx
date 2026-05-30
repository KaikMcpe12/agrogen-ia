import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Moon, Sun, User, Menu, LogOut } from "lucide-react";
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
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    if (avatarOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [avatarOpen]);

  const handleLogout = () => {
    localStorage.removeItem("agrogen_token");
    localStorage.removeItem("agrogen_fazenda_id");
    void navigate("/login");
  };

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
            <div className="relative" ref={avatarRef}>
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-[10px] hover:bg-beige transition-colors"
                onClick={() => setAvatarOpen((v) => !v)}
                aria-label="Menu do usuário"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                  style={{ background: "linear-gradient(135deg, #8B5E3C, #B98E6A)" }}
                >
                  <User size={14} />
                </div>
                <ChevronDown size={14} className="text-ink-4 hidden sm:block" />
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-line rounded-[12px] shadow-[var(--shadow-md)] z-50 overflow-hidden">
                  <NavLink
                    to="/perfil"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-[14px] text-ink hover:bg-beige transition-colors"
                  >
                    <User size={15} className="text-ink-3" />
                    Perfil
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-[14px] text-danger hover:bg-danger-bg transition-colors border-t border-line"
                  >
                    <LogOut size={15} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <AlertDrawer open={alertDrawerOpen} onClose={() => setAlertDrawerOpen(false)} />
    </>
  );
}
