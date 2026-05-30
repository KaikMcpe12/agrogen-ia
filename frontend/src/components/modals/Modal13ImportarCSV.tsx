import { useState, useRef } from "react";
import { X, Download, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useScrollLock } from "@/hooks/useScrollLock";

type Passo = 1 | 2 | 3;

interface ImportResult {
  importados: number;
  erros: number;
  linhas_com_erro: { linha: number; motivo: string }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function Modal13ImportarCSV({ open, onClose, onSuccess }: Props) {
  useScrollLock(open);

  const [passo, setPasso] = useState<Passo>(1);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPasso(1);
    setFile(null);
    setResult(null);
    setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setResult({ importados: 8, erros: 1, linhas_com_erro: [{ linha: 5, motivo: "Campo 'espécie' inválido: 'EQUINO'" }] });
    setLoading(false);
    setPasso(3);
    onSuccess?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden md:block" onClick={handleClose} />
      <div className="relative bg-surface flex flex-col w-full h-full md:h-auto md:max-w-lg md:rounded-[16px] md:border md:border-line md:max-h-[90dvh] md:shadow-[var(--shadow-lg)] md:mx-4">

        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div>
            <p className="text-[12px] font-mono text-ink-4">Passo {passo} de 3</p>
            <h3 className="text-[17px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
              Importar Animais via CSV
            </h3>
          </div>
          <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-ink-3 hover:bg-beige" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center px-5 pt-4 gap-1 shrink-0">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${s < passo ? "bg-green-700 text-white" : s === passo ? "bg-green-900 text-white" : "bg-beige border border-line text-ink-4"}`}>
                {s < passo ? "✓" : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${s < passo ? "bg-green-700" : "bg-line"}`} />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {passo === 1 && (
            <>
              <p className="text-[14px] text-ink-2">Baixe o template CSV e preencha com os dados dos seus animais.</p>
              <div className="rounded-[12px] border-2 border-dashed border-green-700/30 bg-green-100/10 p-6 text-center">
                <Download size={32} className="text-green-700 mx-auto mb-3" />
                <p className="text-[14px] font-medium text-ink mb-1">Template CSV — Animais</p>
                <p className="text-[12px] text-ink-4 mb-4">Contém todos os campos obrigatórios e exemplos</p>
                <Button variant="secondary" size="sm" onClick={() => { const a = document.createElement("a"); a.href = "/mock-template.csv"; a.download = "template-animais.csv"; a.click(); }}>
                  <Download size={14} /> Baixar template
                </Button>
              </div>
              <div className="bg-beige rounded-[10px] px-4 py-3 text-[13px] text-ink-3">
                <p className="font-semibold text-ink-2 mb-1">Campos obrigatórios:</p>
                <p>codigo, nome, especie (BOVINO/OVINO/CAPRINO), sexo (FEMEA/MACHO), data_nascimento (YYYY-MM-DD), peso_inicial_kg, raca_principal</p>
              </div>
            </>
          )}

          {passo === 2 && (
            <>
              <p className="text-[14px] text-ink-2">Selecione o arquivo CSV preenchido para importação.</p>
              <div
                className="rounded-[12px] border-2 border-dashed border-line bg-beige/50 p-8 text-center cursor-pointer hover:border-green-700/40 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={32} className="text-ink-4 mx-auto mb-3" />
                {file ? (
                  <>
                    <p className="text-[14px] font-semibold text-green-700">{file.name}</p>
                    <p className="text-[12px] text-ink-4 mt-1">{(file.size / 1024).toFixed(1)} KB · Clique para trocar</p>
                  </>
                ) : (
                  <>
                    <p className="text-[14px] font-medium text-ink">Arraste o arquivo ou clique para selecionar</p>
                    <p className="text-[12px] text-ink-4 mt-1">Formato: .csv · Máx. 5 MB</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }}
                />
              </div>
            </>
          )}

          {passo === 3 && result && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-4 rounded-[12px] bg-green-100/30 border border-green-700/20">
                <CheckCircle2 size={24} className="text-ok shrink-0" />
                <div>
                  <p className="text-[15px] font-semibold text-ink">{result.importados} animal(is) importado(s)</p>
                  <p className="text-[13px] text-ink-3">Registros adicionados com sucesso ao rebanho.</p>
                </div>
              </div>
              {result.erros > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-warn" />
                    <p className="text-[14px] font-medium text-ink">{result.erros} linha(s) com erro</p>
                  </div>
                  <div className="rounded-[10px] border border-line overflow-hidden">
                    {result.linhas_com_erro.map((e) => (
                      <div key={e.linha} className="px-3 py-2 border-b border-line last:border-0 text-[13px]">
                        <span className="font-mono text-ink-4">Linha {e.linha}:</span>{" "}
                        <span className="text-ink-2">{e.motivo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between px-5 py-3 bg-beige border-t border-line shrink-0">
          {passo === 1 ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleClose}>Fechar</Button>
              <Button variant="primary" size="sm" onClick={() => setPasso(2)}>Próximo: Upload →</Button>
            </>
          ) : passo === 2 ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setPasso(1)}>← Voltar</Button>
              <Button variant="primary" size="sm" onClick={handleUpload} loading={loading} disabled={!file}>
                Importar {file ? `"${file.name}"` : "CSV"}
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={handleClose} className="ml-auto">Fechar</Button>
          )}
        </div>
      </div>
    </div>
  );
}
