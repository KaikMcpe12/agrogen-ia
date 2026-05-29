import { useNavigate } from "react-router-dom";

export default function Animals() {
  const navigate = useNavigate();

  return (
    <div className="animals-page">
      <div className="header">
        <div>
          <h1>Animais</h1>
          <p>15 animais cadastrados no rebanho</p>
        </div>

        <button
          onClick={() => navigate("/animais/cadastro")}
        >
          + Cadastrar animal
        </button>
      </div>

      {/* filtros */}

      {/* tabela */}
    </div>
  );
}