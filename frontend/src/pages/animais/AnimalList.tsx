// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { useNavigate } from "react-router-dom";
// import { Search, Plus, SlidersHorizontal, Eye, Trash2 } from "lucide-react";
// import { Card } from "@/components/ui/Card";
// import { Button } from "@/components/ui/Button";
// import { Badge } from "@/components/ui/Badge";
// import { Input } from "@/components/ui/Input";
// import { animaisApi } from "@/lib/api/endpoints/animais";
// import { useDebounce } from "@/hooks/useDebounce";
// // import { Modal01NewAnimalStep1, type Step1Data } from "@/components/modals/Modal01NewAnimalStep1";
// // import { Modal02NewAnimalStep2 } from "@/components/modals/Modal02NewAnimalStep2";
// import { ModalChatNewAnimal } from "@/components/modals/ModalChatNewAnimal";
// import type { Animal, Especie, StatusAnimal } from "@/types";

// const ESPECIE_LABELS: Record<Especie, string> = { BOVINO: "🐄 Bovino", OVINO: "🐑 Ovino", CAPRINO: "🐐 Caprino" };
// const ESPECIE_VARIANT: Record<Especie, "bovino" | "ovino" | "caprino"> = { BOVINO: "bovino", OVINO: "ovino", CAPRINO: "caprino" };

// const STATUS_LABELS: Record<StatusAnimal, string> = {
//   ATIVA: "Ativa",
//   PRENHA: "Prenha",
//   EM_REPOUSO: "Em repouso",
//   DESCARTADA: "Descartada",
//   REPRODUTOR_ATIVO: "Reprodutor",
//   EM_MONITORAMENTO: "Monitoramento",
// };
// const STATUS_VARIANT: Record<StatusAnimal, "ok" | "info" | "ghost" | "danger" | "bovino" | "warn"> = {
//   ATIVA: "ok",
//   PRENHA: "info",
//   EM_REPOUSO: "warn",
//   DESCARTADA: "danger",
//   REPRODUTOR_ATIVO: "bovino",
//   EM_MONITORAMENTO: "warn",
// };

// function AnimalCard({ animal, onView }: { animal: Animal; onView: () => void }) {
//   return (
//     <Card
//       padding="sm"
//       className={`cursor-pointer hover:border-green-200 transition-colors ${animal.status === "DESCARTADA" ? "opacity-50" : ""}`}
//       onClick={onView}
//     >
//       <div className="flex items-center gap-3">
//         <div className="w-10 h-10 rounded-[10px] bg-green-100 flex items-center justify-center text-lg shrink-0">
//           {animal.especie === "BOVINO" ? "🐄" : animal.especie === "OVINO" ? "🐑" : "🐐"}
//         </div>
//         <div className="flex-1 min-w-0">
//           <div className="flex items-center gap-2">
//             <p className="text-[14px] font-semibold text-ink truncate">{animal.nome}</p>
//             <Badge variant={STATUS_VARIANT[animal.status]} className="shrink-0">
//               {STATUS_LABELS[animal.status]}
//             </Badge>
//           </div>
//           <p className="text-[12px] font-mono text-ink-4">{animal.codigo} · {animal.raca_principal}</p>
//         </div>
//         <Eye size={16} className="text-ink-4 shrink-0" />
//       </div>
//     </Card>
//   );
// }

// function AnimalTableRow({ animal, onView, onDelete }: { animal: Animal; onView: () => void; onDelete: () => void }) {
//   return (
//     <tr
//       className={`border-b border-line hover:bg-beige/50 transition-colors cursor-pointer ${animal.status === "DESCARTADA" ? "opacity-50" : ""}`}
//       onClick={onView}
//     >
//       <td className="px-4 py-3">
//         <span className="text-[12px] font-mono text-ink-3">{animal.codigo}</span>
//       </td>
//       <td className="px-4 py-3 font-medium text-[14px] text-ink">{animal.nome}</td>
//       <td className="px-4 py-3">
//         <Badge variant={ESPECIE_VARIANT[animal.especie]}>{ESPECIE_LABELS[animal.especie]}</Badge>
//       </td>
//       <td className="px-4 py-3 text-[13px] text-ink-2">{animal.raca_principal}</td>
//       <td className="px-4 py-3 text-[13px] text-ink-3">{animal.sexo === "FEMEA" ? "♀ Fêmea" : "♂ Macho"}</td>
//       <td className="px-4 py-3">
//         <Badge variant={STATUS_VARIANT[animal.status]}>{STATUS_LABELS[animal.status]}</Badge>
//       </td>
//       <td className="px-4 py-3 text-[13px] text-ink-3">{animal.condicao_corporal}/5</td>
//       <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
//         <div className="flex gap-1">
//           <button
//             onClick={onView}
//             className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-4 hover:bg-beige transition-colors"
//             aria-label="Ver perfil"
//           >
//             <Eye size={14} />
//           </button>
//           <button
//             onClick={onDelete}
//             className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-4 hover:bg-danger-bg hover:text-danger transition-colors"
//             aria-label="Excluir"
//           >
//             <Trash2 size={14} />
//           </button>
//         </div>
//       </td>
//     </tr>
//   );
// }

// export function AnimalListPage() {
//   const navigate = useNavigate();
//   const [q, setQ] = useState("");
//   const [especieFilter, setEspecieFilter] = useState<Especie | "">("");
//   const [statusFilter, setStatusFilter] = useState<StatusAnimal | "">("");
//   const [page, setPage] = useState(1);
//   const debouncedQ = useDebounce(q);
//   /*
//   const [showModal01, setShowModal01] = useState(false);
//   const [showModal02, setShowModal02] = useState(false);
//   const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
//   */
//   const [showChatModal, setShowChatModal] = useState(false);

//   const { data, isLoading } = useQuery({
//     queryKey: ["animais", debouncedQ, especieFilter, statusFilter, page],
//     queryFn: () =>
//       animaisApi.listar({
//         q: debouncedQ || undefined,
//         especie: especieFilter || undefined,
//         status: statusFilter || undefined,
//         page,
//         limit: 20,
//       }),
//   });

//   const animais = data?.data ?? [];
//   const meta = data?.meta;

//   return (
//     <div className="max-w-[1440px] mx-auto px-4 py-6 flex flex-col gap-4">
//       {/* Header */}
//       <div className="flex items-center justify-between gap-4">
//         <div>
//           <h1 className="text-[22px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
//             Animais
//           </h1>
//           {meta && (
//             <p className="text-[14px] text-ink-3 mt-0.5">{meta.total} animais cadastrados</p>
//           )}
//         </div>
//         {/* <Button variant="primary" size="sm" onClick={() => setShowModal01(true)}> */}
//         <Button variant="primary" size="sm" onClick={() => setShowChatModal(true)}>
//           <Plus size={16} />
//           Novo Animal
//         </Button>
//       </div>

//       {/* Search + filters */}
//       <div className="flex flex-col sm:flex-row gap-3">
//         <div className="flex-1">
//           <Input
//             placeholder="Buscar por nome, código BOV/OVI/CAP, brinco…"
//             value={q}
//             onChange={(e) => { setQ(e.target.value); setPage(1); }}
//             leftIcon={<Search size={16} />}
//           />
//         </div>
//         <button className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-line bg-surface text-[14px] font-medium text-ink-3 hover:bg-beige transition-colors min-h-[44px]">
//           <SlidersHorizontal size={16} />
//           Filtros avançados
//         </button>
//       </div>

//       {/* Quick filter chips */}
//       <div className="flex flex-wrap gap-2">
//         {(["", "BOVINO", "OVINO", "CAPRINO"] as const).map((e) => (
//           <button
//             key={e}
//             onClick={() => { setEspecieFilter(e); setPage(1); }}
//             className={[
//               "px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors",
//               especieFilter === e
//                 ? "bg-green-900 text-white border-green-900"
//                 : "bg-surface text-ink-3 border-line hover:bg-beige",
//             ].join(" ")}
//           >
//             {e === "" ? "Todos" : ESPECIE_LABELS[e]}
//           </button>
//         ))}
//         <span className="w-px bg-line mx-1" />
//         {(["", "ATIVA", "PRENHA", "EM_REPOUSO", "DESCARTADA"] as const).map((s) => (
//           <button
//             key={s}
//             onClick={() => { setStatusFilter(s); setPage(1); }}
//             className={[
//               "px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors",
//               statusFilter === s
//                 ? "bg-green-900 text-white border-green-900"
//                 : "bg-surface text-ink-3 border-line hover:bg-beige",
//             ].join(" ")}
//           >
//             {s === "" ? "Todos os status" : STATUS_LABELS[s]}
//           </button>
//         ))}
//       </div>

//       {/* Content */}
//       {isLoading ? (
//         <div className="flex flex-col gap-3">
//           {[...Array(5)].map((_, i) => <Card key={i} className="h-16 animate-pulse bg-beige">{null}</Card>)}
//         </div>
//       ) : animais.length === 0 ? (
//         <div className="text-center py-16">
//           <p className="text-5xl mb-4">🐄</p>
//           <h3 className="text-[17px] font-semibold text-ink mb-1" style={{ fontFamily: "var(--font-display)" }}>
//             Nenhum animal encontrado
//           </h3>
//           <p className="text-[14px] text-ink-3">Tente ajustar os filtros ou cadastre o primeiro animal.</p>
//         </div>
//       ) : (
//         <>
//           {/* Mobile: cards */}
//           <div className="flex flex-col gap-3 md:hidden">
//             {animais.map((a) => (
//               <AnimalCard key={a.id} animal={a} onView={() => void navigate(`/animais/${a.id}`)} />
//             ))}
//           </div>

//           {/* Desktop: table */}
//           <div className="hidden md:block overflow-hidden rounded-[18px] border border-line bg-surface">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-beige border-b border-line">
//                   {["Código", "Nome", "Espécie", "Raça", "Sexo", "Status", "CC", "Ações"].map((h) => (
//                     <th key={h} className="px-4 py-3 text-left text-[12px] font-semibold text-ink-2 uppercase tracking-[0.04em]">
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {animais.map((a) => (
//                   <AnimalTableRow
//                     key={a.id}
//                     animal={a}
//                     onView={() => void navigate(`/animais/${a.id}`)}
//                     onDelete={() => {}}
//                   />
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination */}
//           {meta && meta.total_pages > 1 && (
//             <div className="flex items-center justify-between pt-2">
//               <p className="text-[13px] text-ink-3">
//                 Página {meta.page} de {meta.total_pages} · {meta.total} animais
//               </p>
//               <div className="flex gap-2">
//                 <Button variant="secondary" size="sm" disabled={!meta.has_prev} onClick={() => setPage((p) => p - 1)}>
//                   Anterior
//                 </Button>
//                 <Button variant="secondary" size="sm" disabled={!meta.has_next} onClick={() => setPage((p) => p + 1)}>
//                   Próxima
//                 </Button>
//               </div>
//             </div>
//           )}
//         </>
//       )}
//           <ModalChatNewAnimal
//       open={showChatModal}
//       onClose={() => setShowChatModal(false)}
//       />
//       {/* <Modal01NewAnimalStep1
//         open={showModal01}
//         onClose={() => setShowModal01(false)}
//         onNext={(data) => {
//           setStep1Data(data);
//           setShowModal01(false);
//           setShowModal02(true);
//         }}
//       />
//       <Modal02NewAnimalStep2
//         open={showModal02}
//         onClose={() => { setShowModal02(false); setStep1Data(null); }}
//         onBack={() => { setShowModal02(false); setShowModal01(true); }}
//         step1Data={step1Data}
//       /> */}
//     </div>
//   );
// }
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, Plus, SlidersHorizontal, Eye, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { useDebounce } from "@/hooks/useDebounce";
import { ModalNewAnimalSelector } from "@/components/modals/ModalNewAnimalSelector";
import type { Animal, Especie, StatusAnimal } from "@/types";

const ESPECIE_LABELS: Record<Especie, string> = { BOVINO: "🐄 Bovino", OVINO: "🐑 Ovino", CAPRINO: "🐐 Caprino" };
const ESPECIE_VARIANT: Record<Especie, "bovino" | "ovino" | "caprino"> = { BOVINO: "bovino", OVINO: "ovino", CAPRINO: "caprino" };

const STATUS_LABELS: Record<StatusAnimal, string> = {
  ATIVA: "Ativa",
  PRENHA: "Prenha",
  EM_REPOUSO: "Em repouso",
  DESCARTADA: "Descartada",
  REPRODUTOR_ATIVO: "Reprodutor",
  EM_MONITORAMENTO: "Monitoramento",
};
const STATUS_VARIANT: Record<StatusAnimal, "ok" | "info" | "ghost" | "danger" | "bovino" | "warn"> = {
  ATIVA: "ok",
  PRENHA: "info",
  EM_REPOUSO: "warn",
  DESCARTADA: "danger",
  REPRODUTOR_ATIVO: "bovino",
  EM_MONITORAMENTO: "warn",
};

function AnimalCard({ animal, onView }: { animal: Animal; onView: () => void }) {
  return (
    <Card
      padding="sm"
      className={`cursor-pointer hover:border-green-200 transition-colors ${animal.status === "DESCARTADA" ? "opacity-50" : ""}`}
      onClick={onView}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-green-100 flex items-center justify-center text-lg shrink-0">
          {animal.especie === "BOVINO" ? "🐄" : animal.especie === "OVINO" ? "🐑" : "🐐"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-ink truncate">{animal.nome}</p>
            <Badge variant={STATUS_VARIANT[animal.status]} className="shrink-0">
              {STATUS_LABELS[animal.status]}
            </Badge>
          </div>
          <p className="text-[12px] font-mono text-ink-4">{animal.codigo} · {animal.raca_principal}</p>
        </div>
        <Eye size={16} className="text-ink-4 shrink-0" />
      </div>
    </Card>
  );
}

function AnimalTableRow({ animal, onView, onDelete }: { animal: Animal; onView: () => void; onDelete: () => void }) {
  return (
    <tr
      className={`border-b border-line hover:bg-beige/50 transition-colors cursor-pointer ${animal.status === "DESCARTADA" ? "opacity-50" : ""}`}
      onClick={onView}
    >
      <td className="px-4 py-3">
        <span className="text-[12px] font-mono text-ink-3">{animal.codigo}</span>
      </td>
      <td className="px-4 py-3 font-medium text-[14px] text-ink">{animal.nome}</td>
      <td className="px-4 py-3">
        <Badge variant={ESPECIE_VARIANT[animal.especie]}>{ESPECIE_LABELS[animal.especie]}</Badge>
      </td>
      <td className="px-4 py-3 text-[13px] text-ink-2">{animal.raca_principal}</td>
      <td className="px-4 py-3 text-[13px] text-ink-3">{animal.sexo === "FEMEA" ? "♀ Fêmea" : "♂ Macho"}</td>
      <td className="px-4 py-3">
        <Badge variant={STATUS_VARIANT[animal.status]}>{STATUS_LABELS[animal.status]}</Badge>
      </td>
      <td className="px-4 py-3 text-[13px] text-ink-3">{animal.condicao_corporal}/5</td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1">
          <button
            onClick={onView}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-4 hover:bg-beige transition-colors"
            aria-label="Ver perfil"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-4 hover:bg-danger-bg hover:text-danger transition-colors"
            aria-label="Excluir"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function AnimalListPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [especieFilter, setEspecieFilter] = useState<Especie | "">("");
  const [statusFilter, setStatusFilter] = useState<StatusAnimal | "">("");
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q);
  const [showChatModal, setShowChatModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["animais", debouncedQ, especieFilter, statusFilter, page],
    queryFn: () =>
      animaisApi.listar({
        q: debouncedQ || undefined,
        especie: especieFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 20,
      }),
  });

  const animais = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Animais
          </h1>
          {meta && (
            <p className="text-[14px] text-ink-3 mt-0.5">{meta.total} animais cadastrados</p>
          )}
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowChatModal(true)}>
          <Plus size={16} />
          Novo Animal
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome, código BOV/OVI/CAP, brinco…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            leftIcon={<Search size={16} />}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-line bg-surface text-[14px] font-medium text-ink-3 hover:bg-beige transition-colors min-h-[44px]">
          <SlidersHorizontal size={16} />
          Filtros avançados
        </button>
      </div>

      {/* Quick filter chips */}
      <div className="flex flex-wrap gap-2">
        {(["", "BOVINO", "OVINO", "CAPRINO"] as const).map((e) => (
          <button
            key={e}
            onClick={() => { setEspecieFilter(e); setPage(1); }}
            className={[
              "px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors",
              especieFilter === e
                ? "bg-green-900 text-white border-green-900"
                : "bg-surface text-ink-3 border-line hover:bg-beige",
            ].join(" ")}
          >
            {e === "" ? "Todos" : ESPECIE_LABELS[e]}
          </button>
        ))}
        <span className="w-px bg-line mx-1" />
        {(["", "ATIVA", "PRENHA", "EM_REPOUSO", "DESCARTADA"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={[
              "px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors",
              statusFilter === s
                ? "bg-green-900 text-white border-green-900"
                : "bg-surface text-ink-3 border-line hover:bg-beige",
            ].join(" ")}
          >
            {s === "" ? "Todos os status" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <Card key={i} className="h-16 animate-pulse bg-beige">{null}</Card>)}
        </div>
      ) : animais.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🐄</p>
          <h3 className="text-[17px] font-semibold text-ink mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Nenhum animal encontrado
          </h3>
          <p className="text-[14px] text-ink-3">Tente ajustar os filtros ou cadastre o primeiro animal.</p>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {animais.map((a) => (
              <AnimalCard key={a.id} animal={a} onView={() => void navigate(`/animais/${a.id}`)} />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-hidden rounded-[18px] border border-line bg-surface">
            <table className="w-full">
              <thead>
                <tr className="bg-beige border-b border-line">
                  {["Código", "Nome", "Espécie", "Raça", "Sexo", "Status", "CC", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[12px] font-semibold text-ink-2 uppercase tracking-[0.04em]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {animais.map((a) => (
                  <AnimalTableRow
                    key={a.id}
                    animal={a}
                    onView={() => void navigate(`/animais/${a.id}`)}
                    onDelete={() => {}}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-[13px] text-ink-3">
                Página {meta.page} de {meta.total_pages} · {meta.total} animais
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={!meta.has_prev} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <Button variant="secondary" size="sm" disabled={!meta.has_next} onClick={() => setPage((p) => p + 1)}>
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ModalNewAnimalSelector
        open={showChatModal}
        onClose={() => setShowChatModal(false)}
      />
    </div>
  );
}
