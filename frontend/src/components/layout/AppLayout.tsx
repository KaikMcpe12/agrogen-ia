import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { InstallPWAPrompt } from "@/components/InstallPWAPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useQuery } from "@tanstack/react-query";
import { alertasApi } from "@/lib/api/endpoints/alertas";

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: alertasData } = useQuery({
    queryKey: ["alertas", "contagem"],
    queryFn: () => alertasApi.contagem(),
    refetchInterval: 60 * 1000,
  });

  const alertCount = alertasData?.data?.nao_lidos ?? 0;

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-bg">
      <OfflineBanner />
      <Header alertCount={alertCount} onMenuToggle={() => setDrawerOpen(true)} />
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main id="main-content" className="flex-1 min-h-0 overflow-y-auto pb-6">
        <Outlet />
      </main>
      <BottomNav />
      <InstallPWAPrompt />
    </div>
  );
}
