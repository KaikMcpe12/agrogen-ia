import { useState } from "react";
import { LoginScreen } from "./pages/Login/Login";
import { RegisterScreen } from "./pages/Register/Resgister";

export function App() {
  // Estado para controlar qual tela está visível no momento
  const [currentTab, setCurrentTab] = useState<"login" | "register">("login");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8f9fa",
        fontFamily: "sans-serif",
      }}
    >
      {/* Botões de navegação (Simulando as suas abas .login-tab) */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setCurrentTab("login")}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            backgroundColor: currentTab === "login" ? "#007bff" : "#e2e8f0",
            color: currentTab === "login" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
          }}
        >
          Acessar Conta
        </button>

        <button
          onClick={() => setCurrentTab("register")}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            backgroundColor: currentTab === "register" ? "#28a745" : "#e2e8f0",
            color: currentTab === "register" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
          }}
        >
          Criar Conta
        </button>
      </div>

      {/* Renderização Condicional: Mostra a tela baseada no estado */}
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "450px",
        }}
      >
        {currentTab === "login" ? <LoginScreen /> : <RegisterScreen />}
      </div>
    </div>
  );
}
