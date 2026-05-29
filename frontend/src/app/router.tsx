import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { alertasApi } from "@/lib/api/endpoints/alertas";

function AppLayout() {
  const { data: alertasData } = useQuery({
    queryKey: ["alertas", "nao_lidos"],
    queryFn: () => alertasApi.listar({ lido: false, resolvido: false }),
    refetchInterval: 5 * 60 * 1000,
  });

  const alertCount = alertasData?.meta.nao_lidos ?? 0;

  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <Header alertCount={alertCount} />
      <main className="flex-1 pb-20 md:pb-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", lazy: () => import("@/pages/auth/Login").then((m) => ({ Component: m.LoginPage })) },
  { path: "/cadastro", lazy: () => import("@/pages/auth/Register").then((m) => ({ Component: m.RegisterPage })) },
  {
    element: <AppLayout />,
    children: [
      { path: "/dashboard", lazy: () => import("@/pages/dashboard/Dashboard").then((m) => ({ Component: m.DashboardPage })) },
      { path: "/animais", lazy: () => import("@/pages/animais/AnimalList").then((m) => ({ Component: m.AnimalListPage })) },
      { path: "/animais/:id", lazy: () => import("@/pages/animais/AnimalDetail").then((m) => ({ Component: m.AnimalDetailPage })) },
      { path: "/inseminacao", lazy: () => import("@/pages/inseminacao/InseminacaoList").then((m) => ({ Component: m.InseminacaoListPage })) },
      { path: "/analise-ia", lazy: () => import("@/pages/ia/AnaliseIA").then((m) => ({ Component: m.AnaliseIAPage })) },
      { path: "/diario-de-bordo", lazy: () => import("@/pages/diario/DiarioList").then((m) => ({ Component: m.DiarioListPage })) },
      { path: "/diario-de-bordo/:id", lazy: () => import("@/pages/diario/DiarioAnimal").then((m) => ({ Component: m.DiarioAnimalPage })) },
      { path: "/relatorios", lazy: () => import("@/pages/relatorios/Relatorios").then((m) => ({ Component: m.RelatoriosPage })) },
    ],
  },
]);
