import { Link } from "react-router-dom";
import { MapPinOff } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-6 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-beige flex items-center justify-center">
        <MapPinOff size={28} className="text-ink-3" />
      </div>
      <div>
        <h1 className="text-[22px] font-bold text-ink mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Página não encontrada
        </h1>
        <p className="text-[14px] text-ink-3 max-w-sm">
          O endereço que você tentou acessar não existe.
        </p>
      </div>
      <Link
        to="/dashboard"
        className="px-5 py-2.5 rounded-[10px] bg-green-700 text-white text-[14px] font-semibold hover:bg-green-800 transition-colors"
      >
        Voltar para o início
      </Link>
    </div>
  );
}
