import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  {
    path: "/login",
    lazy: () =>
      import("@/pages/auth/Login").then((m) => ({ Component: m.LoginPage })),
  },
  {
    path: "/cadastro",
    lazy: () =>
      import("@/pages/auth/Register").then((m) => ({
        Component: m.RegisterPage,
      })),
  },
  {
    path: "/recuperar-senha",
    lazy: () =>
      import("@/pages/auth/RecuperarSenha").then((m) => ({
        Component: m.RecuperarSenhaPage,
      })),
  },
  {
    path: "/redefinir-senha",
    lazy: () =>
      import("@/pages/auth/RedefinirSenha").then((m) => ({
        Component: m.RedefinirSenhaPage,
      })),
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: "/dashboard",
        lazy: () =>
          import("@/pages/dashboard/Dashboard").then((m) => ({
            Component: m.DashboardPage,
          })),
      },
      {
        path: "/animais",
        lazy: () =>
          import("@/pages/animais/AnimalList").then((m) => ({
            Component: m.AnimalListPage,
          })),
      },
      {
        path: "/animais/:id",
        lazy: () =>
          import("@/pages/animais/AnimalDetail").then((m) => ({
            Component: m.AnimalDetailPage,
          })),
      },
      {
        path: "/inseminacao",
        lazy: () =>
          import("@/pages/inseminacao/InseminacaoList").then((m) => ({
            Component: m.InseminacaoListPage,
          })),
      },
      {
        path: "/analise-ia",
        lazy: () =>
          import("@/pages/ia/AnaliseIA").then((m) => ({
            Component: m.AnaliseIAPage,
          })),
      },
      {
        path: "/diario-de-bordo",
        lazy: () =>
          import("@/pages/diario/DiarioList").then((m) => ({
            Component: m.DiarioListPage,
          })),
      },
      {
        path: "/diario-de-bordo/:id",
        lazy: () =>
          import("@/pages/diario/DiarioAnimal").then((m) => ({
            Component: m.DiarioAnimalPage,
          })),
      },
      {
        path: "/relatorios",
        lazy: () =>
          import("@/pages/relatorios/Relatorios").then((m) => ({
            Component: m.RelatoriosPage,
          })),
      },
      {
        path: "/perfil",
        lazy: () =>
          import("@/pages/perfil/Perfil").then((m) => ({
            Component: m.PerfilPage,
          })),
      },
      {
        path: "/reprodutores",
        lazy: () =>
          import("@/pages/reprodutores/ReprodutorList").then((m) => ({
            Component: m.ReprodutorListPage,
          })),
      },
      {
        path: "/reprodutores/:id",
        lazy: () =>
          import("@/pages/reprodutores/ReprodutorDetail").then((m) => ({
            Component: m.ReprodutorDetailPage,
          })),
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
