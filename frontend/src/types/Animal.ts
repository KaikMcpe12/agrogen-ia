export interface DadosGeneticos {
  raca_principal: string;
  raca_pai?: string;
  raca_mae?: string;
  dep_peso_desmame?: number;
  dep_peso_sobrean?: number;
  dep_fertilidade?: number;
  dep_acuracia?: number;
  heterose_esperada?: number;
}

export interface Animal {
  id: string;
  nome: string;
  codigo?: string;
  especie: string;
  raca: string;
  sexo: string;
  linhagem: string;
  historico: string;
  status: string;
  data_nascimento?: string;
  peso_inicial_kg?: number;
  condicao_corporal?: number;
  brinco?: string;
  num_partos?: number;
  data_ultimo_parto?: string;
  observacoes?: string;
  dados_geneticos?: DadosGeneticos;
  created_at?: string;
}