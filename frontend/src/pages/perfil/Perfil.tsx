import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { authApi } from "@/lib/api/endpoints/auth";
import { STORAGE_KEYS } from "@/lib/storage-keys";

const PERFIL_LABELS: Record<string, string> = {
  PRODUTOR: "Produtor Rural",
  TECNICO: "Técnico Agropecuário",
  VETERINARIO: "Veterinário",
};

export function PerfilPage() {
  const navigate = useNavigate();
  const fazendaId = localStorage.getItem(STORAGE_KEYS.fazendaAtivaId);

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.me(),
  });

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.fazendaAtivaId);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    void navigate("/login");
  };

  const usuario = data?.data;

  return (
    <div className="max-w-[600px] mx-auto px-4 py-6 flex flex-col gap-4">
      <h1 className="text-[22px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
        Perfil
      </h1>

      {isLoading ? (
        <Card className="h-32 animate-pulse bg-beige">{null}</Card>
      ) : usuario ? (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-[24px] shrink-0"
              style={{ background: "linear-gradient(135deg, #8B5E3C, #B98E6A)" }}
            >
              <User size={28} />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-ink">{usuario.nome}</h2>
              <p className="text-[14px] text-ink-3">{usuario.email}</p>
              <div className="mt-1">
                <Badge variant="bovino">{PERFIL_LABELS[usuario.perfil] ?? usuario.perfil}</Badge>
              </div>
            </div>
          </div>

          <div className="border-t border-line pt-4 grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <p className="text-ink-4">ID do usuário</p>
              <p className="font-mono text-ink-3">{usuario.id}</p>
            </div>
            {fazendaId && (
              <div>
                <p className="text-ink-4">Fazenda ativa</p>
                <p className="font-mono text-ink-3">{fazendaId}</p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-[14px] text-ink-3">Não foi possível carregar os dados do perfil.</p>
        </Card>
      )}

      <Button variant="ghost" size="sm" onClick={handleLogout} className="text-danger hover:bg-danger-bg self-start">
        <LogOut size={15} />
        Sair da conta
      </Button>
    </div>
  );
}
