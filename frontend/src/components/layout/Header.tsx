import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Moon, Sun, User, Menu, LogOut, Building2, Dna } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/hooks/useTheme";
import { useFazendaAtiva } from "@/hooks/useFazendaAtiva";
import { AlertDrawer } from "./AlertDrawer";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fazendasApi } from "@/lib/api/endpoints/fazendas";

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
  const { fazendaId, setFazendaId } = useFazendaAtiva();
  const qc = useQueryClient();
  const [alertDrawerOpen, setAlertDrawerOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [fazendaOpen, setFazendaOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const fazendaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: fazendasData } = useQuery({
    queryKey: ["fazendas", "list"],
    queryFn: ({ signal }) => fazendasApi.listar(signal),
    staleTime: 5 * 60 * 1000,
  });
  const fazendas = fazendasData?.data ?? [];
  const fazendaAtiva = fazendas.find((f) => f.id === fazendaId) ?? fazendas[0] ?? null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
      if (fazendaRef.current && !fazendaRef.current.contains(e.target as Node)) setFazendaOpen(false);
    }
    if (avatarOpen || fazendaOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [avatarOpen, fazendaOpen]);

  const handleChangeFazenda = (id: string) => {
    setFazendaId(id);
    setFazendaOpen(false);
    // Invalida tudo que depende de fazenda (tabela 2.5 — troca de fazenda ativa)
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
    void qc.invalidateQueries({ queryKey: ["animais"] });
    void qc.invalidateQueries({ queryKey: ["inseminacoes"] });
    void qc.invalidateQueries({ queryKey: ["alertas"] });
    void qc.invalidateQueries({ queryKey: ["diario"] });
    void qc.invalidateQueries({ queryKey: ["relatorios"] });
    void qc.invalidateQueries({ queryKey: ["reprodutores"] });
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.fazendaAtivaId);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    sessionStorage.removeItem(STORAGE_KEYS.token);
    void navigate("/login");
  };

  useEffect(() => {
    const handler = () => setAlertDrawerOpen(true);
    window.addEventListener("open-alert-drawer", handler);
    return () => window.removeEventListener("open-alert-drawer", handler);
  }, []);

  return (
    <>
      <header className="z-30 bg-surface border-b border-line shrink-0" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="max-w-[1440px] mx-auto px-4 h-16 flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige"
            onClick={onMenuToggle}
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <NavLink to="/dashboard" className="shrink-0 flex items-center">
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
                    isActive ? "bg-green-700 text-white" : "text-ink-3 hover:text-ink hover:bg-beige",
                    item.highlight && !isActive ? "text-green-700 font-semibold" : "",
                  ].join(" ")
                }
              >
                {item.label}
                {item.highlight && (
                  <span className="ml-1 text-[10px] font-bold bg-amber-soft text-amber px-1 py-0.5 rounded">IA</span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            {/* Seletor de fazenda */}
            {fazendas.length > 0 && (
              <div className="relative" ref={fazendaRef}>
                <button
                  onClick={() => setFazendaOpen((v) => !v)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-line bg-beige hover:bg-beige/80 text-[13px] font-medium text-ink transition-colors max-w-[180px]"
                  aria-label="Selecionar fazenda"
                >
                  <Building2 size={14} className="text-green-700 shrink-0" />
                  <span className="truncate">{fazendaAtiva?.nome ?? "Fazenda"}</span>
                  <ChevronDown size={12} className="text-ink-4 shrink-0" />
                </button>
                {fazendaOpen && (
                  <div className="absolute left-0 top-full mt-1 w-56 bg-surface border border-line rounded-[12px] shadow-[var(--shadow-md)] z-50 overflow-hidden">
                    <p className="px-3 py-2 text-[11px] font-semibold text-ink-4 uppercase tracking-[0.06em] border-b border-line">
                      Suas fazendas
                    </p>
                    {fazendas.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleChangeFazenda(f.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-[13px] hover:bg-beige transition-colors text-left ${f.id === (fazendaAtiva?.id) ? "text-green-700 font-semibold" : "text-ink"}`}
                      >
                        <Building2 size={13} className="shrink-0" />
                        <span className="truncate">{f.nome}</span>
                        {f.id === (fazendaAtiva?.id) && <span className="ml-auto text-[10px]">✓</span>}
                      </button>
                    ))}
                    <div className="border-t border-line">
                      <NavLink
                        to="/perfil?tab=fazendas"
                        onClick={() => setFazendaOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-green-700 hover:bg-beige transition-colors"
                      >
                        Gerenciar fazendas →
                      </NavLink>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                className="flex items-center gap-2 px-2.5 py-2 rounded-[10px] hover:bg-beige transition-colors"
                onClick={() => setAvatarOpen((v) => !v)}
                aria-label="Menu do usuário"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                  style={{ background: "linear-gradient(135deg, #1b4332, #2d6a4f)" }}
                >
                  <User size={14} />
                </div>
                <ChevronDown size={14} className="text-ink-4 hidden sm:block" />
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-line rounded-[12px] shadow-[var(--shadow-md)] z-50 overflow-hidden">
                  <NavLink
                    to="/perfil"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-[14px] text-ink hover:bg-beige transition-colors"
                  >
                    <User size={15} className="text-ink-3" />
                    Perfil
                  </NavLink>
                  <NavLink
                    to="/perfil?tab=fazendas"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-[14px] text-ink hover:bg-beige transition-colors"
                  >
                    <Building2 size={15} className="text-ink-3" />
                    Fazendas
                  </NavLink>
                  <NavLink
                    to="/reprodutores"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-[14px] text-ink hover:bg-beige transition-colors"
                  >
                    <Dna size={15} className="text-ink-3" />
                    Reprodutores
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
