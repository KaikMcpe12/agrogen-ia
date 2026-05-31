// @ts-ignore
window.__SELETOR_LOADED__ = true;
import { useState } from "react";
import { X, LayoutList, MessageCircle } from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { Modal03NewInseminacao } from "./Modal03NewInseminacao";
import { ModalChatNewInseminacao } from "./ModalChatNewInseminacao";

type Mode = "selector" | "tradicional" | "chat";

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedAnimalId?: string;
}

export function ModalNewInseminacaoSelector({ open, onClose, preselectedAnimalId }: Props) {
  useScrollLock(open);
  const [mode, setMode] = useState<Mode>("selector");

  const handleClose = () => {
    setMode("selector");
    onClose();
  };

  if (mode === "tradicional") {
    return (
      <Modal03NewInseminacao
        open
        onClose={handleClose}
        {...(preselectedAnimalId ? { preselectedAnimalId } : {})}
      />
    );
  }

  if (mode === "chat") {
    return <ModalChatNewInseminacao
       open
      onClose={handleClose}
      preselectedAnimalId={preselectedAnimalId}
      />;
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden md:block" onClick={handleClose} />
      <div className="relative bg-surface flex flex-col w-full h-full md:h-auto md:max-w-md md:rounded-[18px] md:border md:border-line md:shadow-[var(--shadow-lg)] md:mx-4">

        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Nova Inseminação
          </h3>
          <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-6">
          <p className="text-[14px] text-ink-3">Como deseja registrar a inseminação?</p>

          <button
            onClick={() => setMode("tradicional")}
            className="group flex items-start gap-4 p-4 rounded-[14px] border border-line hover:border-green-300 hover:bg-green-50/40 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-[10px] bg-beige group-hover:bg-green-100 flex items-center justify-center shrink-0 transition-colors">
              <LayoutList size={20} className="text-ink-3 group-hover:text-green-900 transition-colors" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink">Modo tradicional</p>
              <p className="text-[13px] text-ink-3 mt-0.5 leading-relaxed">
                Preencha os campos em formulário organizado por seções.
              </p>
            </div>
          </button>

          <button
            onClick={() => setMode("chat")}
            className="group flex items-start gap-4 p-4 rounded-[14px] border border-line hover:border-green-300 hover:bg-green-50/40 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-[10px] bg-beige group-hover:bg-green-100 flex items-center justify-center shrink-0 transition-colors">
              <MessageCircle size={20} className="text-ink-3 group-hover:text-green-900 transition-colors" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink">Modo conversa</p>
              <p className="text-[13px] text-ink-3 mt-0.5 leading-relaxed">
                Responda perguntas uma a uma em formato de chat interativo.
              </p>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}