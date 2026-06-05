import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { SkipLink } from "./SkipLink";
import { InstallPWAPrompt } from "@/components/InstallPWAPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useQuery } from "@tanstack/react-query";
import { alertasApi } from "@/lib/api/endpoints/alertas";

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hasToken = !!(
    sessionStorage.getItem(STORAGE_KEYS.token) ??
    localStorage.getItem(STORAGE_KEYS.token)
  );

  const { data: alertasData } = useQuery({
    queryKey: ["alertas", "contagem"],
    queryFn: ({ signal }) => alertasApi.contagem(signal),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    enabled: hasToken,
  });

  const alertCount = alertasData?.data?.nao_lidos ?? 0;

  if (!hasToken) return <Navigate to="/login" replace />;

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-bg">
      <SkipLink />
      <OfflineBanner />
      <Header alertCount={alertCount} onMenuToggle={() => setDrawerOpen(true)} />
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main id="main-content" tabIndex={-1} className="flex-1 min-h-0 overflow-y-auto pb-6">
        <Outlet />
      </main>
      <BottomNav />
      <InstallPWAPrompt />
    </div>
  );
}
