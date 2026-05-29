import React, { useState } from "react";
import { LoginForm } from "../Login/Login";
import { RegisterForm } from "../Register/Register";

export function AuthScreen() {
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <>
      <style>{`
        body, #root { margin: 0; padding: 0; height: 100%; }
        * { box-sizing: border-box; }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          fontFamily: "'Sora', 'Segoe UI', sans-serif",
          backgroundColor: "#f5f3ee",
          overflow: "hidden",
        }}
      >
        {/* ── Painel Esquerdo (Informativo / Boas-vindas) ── */}
        <div
          style={{
            flex: 1,
            background: "linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 40%, #4a7c45 70%, #7a6b2e 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "2.5rem",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at 60% 80%, rgba(180,120,30,0.28) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", zIndex: 1 }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: "rgba(255,255,255,0.12)",
                border: "1.5px solid rgba(255,255,255,0.3)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              ✦
            </div>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
              AgroGen <span style={{ color: "#d4a830" }}>IA</span>
            </span>
          </div>

          {/* Conteúdo central */}
          <div style={{ zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h1
              style={{
                fontSize: "clamp(2rem, 3.2vw, 2.8rem)",
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: "1.25rem",
                letterSpacing: "-0.03em",
                margin: "0 0 1.25rem 0",
              }}
            >
              Genética inteligente
              <br />
              para o{" "}
              <span style={{ color: "#d4a830" }}>
                sertão que
                <br />
                produz.
              </span>
            </h1>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.8)",
                maxWidth: 420,
                marginBottom: "2.5rem",
              }}
            >
              Plataforma de coleta de dados genéticos e monitoramento de
              inseminação artificial com IA para bovinos, ovinos e caprinos.
            </p>
            <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
              {[
                { value: "+62%", label: "Taxa de prenhez" },
                { value: "3 espécies", label: "Bovino · Ovino · Caprino" },
                { value: "100%", label: "Offline-ready" },
              ].map((s) => (
                <div key={s.value} style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#d4a830", lineHeight: 1 }}>
                    {s.value}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", zIndex: 1, margin: 0 }}>
            Hackathon Expoagro Crateús 2026 · Prefeitura Municipal de Crateús/CE
          </p>
        </div>

        {/* ── Painel Direito (Formulários dinâmicos) ── */}
        <div
          style={{
            width: 500,
            minWidth: 420,
            backgroundColor: "#f5f3ee",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "3rem 3.5rem",
            overflowY: "auto",
          }}
        >
          {/* Logo direita */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "2rem" }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: "#2d5a3d",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                color: "#fff",
              }}
            >
              ✦
            </div>
            <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1a2e1a", letterSpacing: "-0.02em" }}>
              AgroGen <span style={{ color: "#d4a830" }}>IA</span>
            </span>
          </div>

          {/* Abas Alternadoras */}
          <div
            style={{
              display: "flex",
              backgroundColor: "#e8e4da",
              borderRadius: 10,
              padding: 4,
              marginBottom: "2rem",
              gap: 4,
            }}
          >
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "0.5rem 0",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: tab === t ? 600 : 500,
                  fontFamily: "inherit",
                  backgroundColor: tab === t ? "#fff" : "transparent",
                  color: tab === t ? "#1a2e1a" : "#6b6b5e",
                  boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {t === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {/* Renderização Condicional */}
          {tab === "login" ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </>
  );
}