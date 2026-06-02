import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Building2, Shield, LogOut, Pencil, Trash2, Plus, FileText, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { authApi } from "@/lib/api/endpoints/auth";
import { fazendasApi } from "@/lib/api/endpoints/fazendas";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { Modal11FazendaForm } from "@/components/modals/Modal11FazendaForm";
import { Modal14ExcluirConta } from "@/components/modals/Modal14ExcluirConta";
import { Modal15AlterarSenha } from "@/components/modals/Modal15AlterarSenha";
import { useTheme } from "@/hooks/useTheme";
import { getApiErrorMessage } from "@/lib/api/error-messages";
import type { Fazenda } from "@/types";

type Tab = "dados" | "fazendas" | "privacidade";

const PERFIL_LABELS: Record<string, string> = {
  PRODUTOR: "Produtor Rural",
  TECNICO: "Técnico Agropecuário",
  VETERINARIO: "Veterinário",
};

/* ── Aba Dados Pessoais ────────────────────────────────────────── */
function TabDados() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [modal15, setModal15] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["usuarios", "me"],
    queryFn: ({ signal }) => authApi.me(signal),
    staleTime: 60 * 60 * 1000,
  });
  const usuario = data?.data;

  const updateMutation = useMutation({
    mutationFn: () => {
      const body: { nome?: string; telefone?: string } = { nome };
      if (telefone) body.telefone = telefone;
      return authApi.atualizarPerfil(body);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["usuarios", "me"] });
      setEditing(false);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  if (isLoading) return <Card className="h-24 animate-pulse bg-beige">{null}</Card>;
  if (!usuario) return null;

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <Card>
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-[22px] font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #1b4332, #2d6a4f)" }}
          >
            {usuario.nome.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-[18px] font-semibold text-ink">{usuario.nome}</h2>
            <p className="text-[14px] text-ink-3">{usuario.email}</p>
            <Badge variant="bovino" className="mt-1">{PERFIL_LABELS[usuario.perfil] ?? usuario.perfil}</Badge>
          </div>
        </div>

        {editing ? (
          <div className="flex flex-col gap-3">
            <Input label="Nome completo" required value={nome} onChange={(e) => setNome(e.target.value)} />
            <MaskedInput
              mask="(00) 00000-0000"
              label="Telefone"
              placeholder="(88) 90000-0000"
              value={telefone}
              onAccept={(v) => setTelefone(v)}
            />
            {error && <p className="text-[12px] text-danger">{error}</p>}
            <div className="flex gap-2 justify-end mt-1">
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button variant="primary" size="sm" onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}>
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <p className="text-ink-4 mb-0.5">Nome</p>
              <p className="text-ink font-medium">{usuario.nome}</p>
            </div>
            <div>
              <p className="text-ink-4 mb-0.5">E-mail (imutável)</p>
              <p className="text-ink-3 font-mono text-[12px]">{usuario.email}</p>
            </div>
            <div>
              <p className="text-ink-4 mb-0.5">Perfil</p>
              <p className="text-ink">{PERFIL_LABELS[usuario.perfil] ?? usuario.perfil}</p>
            </div>
            <div>
              <p className="text-ink-4 mb-0.5">ID</p>
              <p className="text-ink-4 font-mono text-[11px] truncate">{usuario.id}</p>
            </div>
            <div className="col-span-2 flex gap-2 mt-2">
              <Button variant="secondary" size="sm" onClick={() => { setNome(usuario.nome); setEditing(true); }}>
                <Pencil size={13} /> Editar dados
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setModal15(true)}>
                Alterar senha
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal15AlterarSenha open={modal15} onClose={() => setModal15(false)} />
    </div>
  );
}

/* ── Aba Fazendas ──────────────────────────────────────────────── */
function TabFazendas({ onboarding }: { onboarding: boolean }) {
  const qc = useQueryClient();
  const [modal11Mode, setModal11Mode] = useState<"create" | "edit" | null>(null);
  const [editFazenda, setEditFazenda] = useState<Fazenda | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (onboarding && modal11Mode === null) {
      const t = setTimeout(() => setModal11Mode("create"), 800);
      return () => clearTimeout(t);
    }
  }, [onboarding, modal11Mode]);

  const { data, isLoading } = useQuery({
    queryKey: ["fazendas", "list"],
    queryFn: ({ signal }) => fazendasApi.listar(signal),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fazendasApi.deletar(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["fazendas", "list"] });
      setDeleteId(null);
    },
  });

  const fazendas = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-ink-3">{fazendas.length} fazenda(s) cadastrada(s)</p>
        <Button variant="primary" size="sm" onClick={() => { setEditFazenda(null); setModal11Mode("create"); }}>
          <Plus size={15} /> Nova Fazenda
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(2)].map((_, i) => <Card key={i} className="h-20 animate-pulse bg-beige">{null}</Card>)}
        </div>
      ) : fazendas.length === 0 ? (
        <Card padding="md" className="text-center">
          <Building2 size={32} className="text-ink-4 mx-auto mb-3" />
          <p className="text-[15px] font-semibold text-ink mb-1">Nenhuma fazenda cadastrada</p>
          <p className="text-[13px] text-ink-3 mb-4">Cadastre sua primeira fazenda para começar a usar o AgroGen IA.</p>
          <Button variant="primary" size="sm" onClick={() => setModal11Mode("create")}>
            <Plus size={14} /> Cadastrar fazenda
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {fazendas.map((f) => (
            <Card key={f.id} padding="sm" className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-[10px] bg-green-100 flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-green-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[15px] font-semibold text-ink">{f.nome}</p>
                  {f.ativa && <Badge variant="ok">Ativa</Badge>}
                </div>
                <p className="text-[12px] text-ink-3">{f.municipio} · {f.estado}{f.area_hectares ? ` · ${f.area_hectares} ha` : ""}</p>
                {f.tipo_producao && <p className="text-[12px] text-ink-4">{f.tipo_producao}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => { setEditFazenda(f); setModal11Mode("edit"); }}
                  className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-4 hover:bg-beige"
                  aria-label="Editar fazenda"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteId(f.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-4 hover:bg-danger-bg hover:text-danger"
                  aria-label="Excluir fazenda"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmação de exclusão inline */}
      {deleteId && (
        <Card padding="sm" className="border-danger bg-danger-bg/30">
          <p className="text-[14px] text-ink font-medium mb-2">Confirmar exclusão?</p>
          <p className="text-[13px] text-ink-3 mb-3">Esta ação não pode ser desfeita.</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="danger" size="sm" onClick={() => deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}>Excluir</Button>
          </div>
        </Card>
      )}

      <Modal11FazendaForm
        open={modal11Mode !== null}
        onClose={() => { setModal11Mode(null); setEditFazenda(null); }}
        mode={modal11Mode ?? "create"}
        {...(editFazenda ? { fazenda: editFazenda } : {})}
      />
    </div>
  );
}

/* ── Aba Privacidade ───────────────────────────────────────────── */
function TabPrivacidade({ email }: { email: string }) {
  const navigate = useNavigate();
  const { toggle: toggleTheme, isDark } = useTheme();
  const [modal14, setModal14] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const handleExportar = async () => {
    setExportLoading(true);
    setExportMsg(null);
    try {
      const res = await authApi.exportarDados();
      setExportMsg(res.data.mensagem ?? "Dados exportados!");
    } catch {
      setExportMsg("Erro ao exportar dados. Tente novamente.");
    }
    setExportLoading(false);
  };

  const handleExcluirConta = async () => {
    localStorage.clear();
    sessionStorage.clear();
    void navigate("/login");
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      {/* Toggle de tema */}
      <Card>
        <h3 className="text-[15px] font-semibold text-ink mb-3" style={{ fontFamily: "var(--font-display)" }}>Aparência</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] text-ink">Tema da interface</p>
            <p className="text-[12px] text-ink-4">Atual: {isDark ? "Escuro" : "Claro"}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-[10px] border border-line bg-beige text-[13px] font-medium text-ink hover:bg-beige/80 transition-colors"
          >
            {isDark ? "🌙 Escuro" : "☀️ Claro"}
          </button>
        </div>
      </Card>

      {/* Exportar dados */}
      <Card>
        <h3 className="text-[15px] font-semibold text-ink mb-1" style={{ fontFamily: "var(--font-display)" }}>Exportar meus dados</h3>
        <p className="text-[13px] text-ink-3 mb-3">Baixe uma cópia de todos os seus dados (LGPD Art. 18).</p>
        {exportMsg && <p className="text-[13px] text-ok mb-2">{exportMsg}</p>}
        <Button variant="secondary" size="sm" onClick={handleExportar} loading={exportLoading}>
          <FileText size={14} /> Exportar dados
        </Button>
      </Card>

      {/* Política de privacidade */}
      <Card>
        <h3 className="text-[15px] font-semibold text-ink mb-1" style={{ fontFamily: "var(--font-display)" }}>Política de Privacidade</h3>
        <a
          href="/politica-de-privacidade"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[13px] text-green-700 hover:underline"
        >
          Ler política de privacidade <ExternalLink size={12} />
        </a>
      </Card>

      {/* Zona de perigo */}
      <Card className="border-danger/30 bg-danger-bg/10">
        <h3 className="text-[15px] font-semibold text-danger mb-1" style={{ fontFamily: "var(--font-display)" }}>Zona de Perigo</h3>
        <p className="text-[13px] text-ink-3 mb-3">A exclusão da conta é irreversível e apagará todos os seus dados.</p>
        <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-bg" onClick={() => setModal14(true)}>
          <Trash2 size={14} /> Excluir minha conta
        </Button>
      </Card>

      <Modal14ExcluirConta
        open={modal14}
        onClose={() => setModal14(false)}
        email={email}
        onConfirm={handleExcluirConta}
      />
    </div>
  );
}

/* ── Página principal ──────────────────────────────────────────── */
export function PerfilPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tabParam = searchParams.get("tab") as Tab | null;
  const isOnboarding = searchParams.get("onboarding") === "true";
  const [tab, setTab] = useState<Tab>(tabParam === "fazendas" ? "fazendas" : tabParam === "privacidade" ? "privacidade" : "dados");

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.me(),
  });

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.fazendaAtivaId);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    sessionStorage.removeItem(STORAGE_KEYS.token);
    void navigate("/login");
  };

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "dados", label: "Dados Pessoais", icon: User },
    { id: "fazendas", label: "Fazendas", icon: Building2 },
    { id: "privacidade", label: "Privacidade", icon: Shield },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
          Perfil
        </h1>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-danger hover:bg-danger-bg">
          <LogOut size={14} /> Sair
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              "flex items-center gap-2 px-5 py-3 text-[14px] font-medium border-b-2 transition-colors flex-shrink-0 whitespace-nowrap",
              tab === id ? "border-green-700 text-green-700" : "border-transparent text-ink-3 hover:text-ink",
            ].join(" ")}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === "dados" && <TabDados />}
      {tab === "fazendas" && <TabFazendas onboarding={isOnboarding} />}
      {tab === "privacidade" && <TabPrivacidade email={meData?.data.email ?? ""} />}
    </div>
  );
}
