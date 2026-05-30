import { NavLink } from "react-router-dom";
import { LayoutDashboard, PawPrint, Syringe, Brain, BookOpen, BarChart2 } from "lucide-react";
import { Drawer } from "./Drawer";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/animais", label: "Animais", icon: PawPrint },
  { to: "/inseminacao", label: "Inseminação", icon: Syringe },
  { to: "/analise-ia", label: "Análise IA", icon: Brain },
  { to: "/diario-de-bordo", label: "Diário de Bordo", icon: BookOpen },
  { to: "/relatorios", label: "Relatórios", icon: BarChart2 },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ open, onClose }: Props) {
  return (
    <Drawer open={open} onClose={onClose} title="Menu" side="left">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-4 py-3 rounded-[12px] text-[15px] font-medium transition-colors",
                isActive
                  ? "bg-green-900 text-white"
                  : "text-ink hover:bg-beige",
              ].join(" ")
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>
    </Drawer>
  );
}
