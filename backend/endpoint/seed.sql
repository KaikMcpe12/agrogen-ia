-- ============================================================
--  AgroGen IA — Script de Seed (Povoamento)
--  Execute APÓS o agroGen_schema.sql
--  Requer extensão pgcrypto para hashing bcrypt
--
--  Credencial padrão de todos os usuários:
--    Senha: agrogen123
--
--  Usuário principal:
--    Email: agrogen@gmail.com  |  Senha: agrogen123  |  Perfil: ADMIN
-- ============================================================

\set ON_ERROR_STOP on

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  -- ── Usuários ────────────────────────────────────────────────
  uid_admin  UUID := 'aaaaaaaa-0000-0000-0000-000000000001';
  uid_prod1  UUID := 'aaaaaaaa-0000-0000-0000-000000000002';
  uid_prod2  UUID := 'aaaaaaaa-0000-0000-0000-000000000003';
  uid_prod3  UUID := 'aaaaaaaa-0000-0000-0000-000000000004';
  uid_tec1   UUID := 'aaaaaaaa-0000-0000-0000-000000000005';
  uid_tec2   UUID := 'aaaaaaaa-0000-0000-0000-000000000006';
  uid_tec3   UUID := 'aaaaaaaa-0000-0000-0000-000000000007';
  uid_vet1   UUID := 'aaaaaaaa-0000-0000-0000-000000000008';
  uid_vet2   UUID := 'aaaaaaaa-0000-0000-0000-000000000009';
  uid_vet3   UUID := 'aaaaaaaa-0000-0000-0000-000000000010';

  -- ── Fazendas ────────────────────────────────────────────────
  uid_faz1   UUID := 'bbbbbbbb-0000-0000-0000-000000000001';
  uid_faz2   UUID := 'bbbbbbbb-0000-0000-0000-000000000002';
  uid_faz3   UUID := 'bbbbbbbb-0000-0000-0000-000000000003';
  uid_faz4   UUID := 'bbbbbbbb-0000-0000-0000-000000000004';
  uid_faz5   UUID := 'bbbbbbbb-0000-0000-0000-000000000005';

  -- ── Reprodutores (referenciados em inseminações) ─────────────
  rep_ids    UUID[] := ARRAY[
    'cccccccc-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000002',
    'cccccccc-0000-0000-0000-000000000003',
    'cccccccc-0000-0000-0000-000000000004',
    'cccccccc-0000-0000-0000-000000000005',
    'cccccccc-0000-0000-0000-000000000006',
    'cccccccc-0000-0000-0000-000000000007',
    'cccccccc-0000-0000-0000-000000000008',
    'cccccccc-0000-0000-0000-000000000009',
    'cccccccc-0000-0000-0000-000000000010'
  ];

  -- ── Protocolo Hormonal ────────────────────────────────────────
  uid_prot1  UUID := 'dddddddd-0000-0000-0000-000000000001';
  uid_prot2  UUID := 'dddddddd-0000-0000-0000-000000000002';
  uid_prot3  UUID := 'dddddddd-0000-0000-0000-000000000003';

  -- ── Trabalho ─────────────────────────────────────────────────
  v_hash     TEXT;
  v_id       UUID;
  v_faz_id   UUID;
  v_animal_id UUID;
  v_ins_id   UUID;
  v_rep_id   UUID;
  v_especie  TEXT;
  v_sexo     TEXT;
  v_peso     NUMERIC;
  v_codigo   TEXT;
  v_data_nasc DATE;
  v_data_ins  TIMESTAMP;
  v_resultado TEXT;
  i          INTEGER;
  j          INTEGER;

  -- Arrays de nomes, raças e locais
  nomes_femea TEXT[] := ARRAY['Mimosa','Estrela','Bonita','Morena','Cheirosa','Pintada','Novinha',
    'Preta','Serena','Amada','Lindinha','Flor','Rosa','Mel','Caramel','Branca','Negra','Sertaneja',
    'Nordestina','Chuvosa','Madrugada','Vaquinha','Bela','Graciosa','Vitória','Esperança','Fé',
    'Canela','Jasmim','Lavanda','Dália','Íris','Orquídea','Margarida','Tulipa','Girassol','Lírio'];
  nomes_macho TEXT[] := ARRAY['Touro','Valente','Guerreiro','Campeão','Nobre','Forte','Bravo',
    'Hercules','Titan','Zeus','Ares','Apolo','Netuno','Atlas','Sansão','Golias','Gigante',
    'Imperador','Rei','Dom','Braveza','Destaque','Elite','Ouro','Prata'];
  racas_bov  TEXT[] := ARRAY['Nelore','Angus','Gir','Guzerá','Tabapuã','Brahman','Simmental',
    'Canchim','Caracu','Hereford','Limousin','Senepol'];
  racas_ovi  TEXT[] := ARRAY['Santa Inês','Morada Nova','Dorper','Suffolk','Somalis Brasileira','Bergamácia'];
  racas_cap  TEXT[] := ARRAY['Saanen','Anglo-nubiano','Boer','Moxotó','Canindé','Azul'];
  fazendas_arr UUID[] := ARRAY[uid_faz1, uid_faz2, uid_faz3, uid_faz4, uid_faz5];
  tec_ids    UUID[] := ARRAY[uid_tec1, uid_tec2, uid_tec3];
  vet_ids    UUID[] := ARRAY[uid_vet1, uid_vet2, uid_vet3];

  -- Controle de animais fêmea para inseminação
  femea_ids  UUID[] := '{}';
  todas_ids  UUID[] := '{}';

BEGIN

  -- ============================================================
  --  HASH ÚNICO PARA TODOS OS USUÁRIOS (senha: agrogen123)
  -- ============================================================
  v_hash := crypt('agrogen123', gen_salt('bf', 10));

  -- ============================================================
  --  USUÁRIOS (10)
  -- ============================================================
  INSERT INTO usuarios (usuario_id, nome, email, senha_hash, cpf, telefone, perfil, ativo) VALUES
    (uid_admin, 'AgroGen Admin',       'agrogen@gmail.com',    v_hash, '00000000001', '(85) 99000-0001', 'ADMIN',       true),
    (uid_prod1, 'João Carlos Bezerra', 'joao.bezerra@rural.com', v_hash, '11122233301', '(85) 98811-1111', 'PRODUTOR',   true),
    (uid_prod2, 'Maria das Graças',    'mgraca.fazenda@gmail.com', v_hash, '22233344402', '(88) 99722-2222', 'PRODUTOR', true),
    (uid_prod3, 'Antônio Sertanejo',   'antonio.sertanejo@agro.com', v_hash, '33344455503', '(83) 98833-3333', 'PRODUTOR', true),
    (uid_tec1,  'Dr. Paulo Mendes',    'paulo.mendes@agrogen.com',   v_hash, '44455566604', '(85) 99144-4444', 'TECNICO',   true),
    (uid_tec2,  'Ana Beatriz Lima',    'ana.lima@tecnica.com',       v_hash, '55566677705', '(85) 98855-5555', 'TECNICO',   true),
    (uid_tec3,  'Carlos Eduardo Neto', 'carlos.neto@campo.com',      v_hash, '66677788806', '(88) 99366-6666', 'TECNICO',   true),
    (uid_vet1,  'Dra. Fernanda Costa', 'fernanda.vet@clinica.com',   v_hash, '77788899907', '(85) 99177-7777', 'VETERINARIO', true),
    (uid_vet2,  'Dr. Marcos Oliveira', 'marcos.vet@agro.com',        v_hash, '88899900008', '(88) 98888-8888', 'VETERINARIO', true),
    (uid_vet3,  'Dra. Juliana Pires',  'juliana.pires@vet.com',      v_hash, '99900011109', '(83) 99299-9999', 'VETERINARIO', true);

  -- ============================================================
  --  FAZENDAS (5)
  -- ============================================================
  INSERT INTO fazendas (fazenda_id, usuario_id, nome, municipio, estado, latitude, longitude,
                        area_hectares, tipo_producao, capacidade_rebanho, ativo) VALUES
    (uid_faz1, uid_prod1, 'Fazenda Boa Vista',     'Crateús',      'CE', -5.1790, -40.6814, 320.50, 'CORTE',       200, true),
    (uid_faz2, uid_prod1, 'Sítio São José',         'Ipaporanga',   'CE', -5.4990, -40.7221, 85.00,  'MISTO',        60, true),
    (uid_faz3, uid_prod2, 'Fazenda Serra Verde',    'Tauá',         'CE', -6.0010, -40.2930, 450.75, 'CORTE',       300, true),
    (uid_faz4, uid_prod2, 'Fazenda do Sertão',      'Piripiri',     'PI', -4.2720, -41.7760, 280.00, 'LEITE',       150, true),
    (uid_faz5, uid_prod3, 'Sítio Cachoeira Funda',  'Patos',        'PB', -7.0200, -37.2770, 120.25, 'SUBSISTENCIA', 80, true);

  -- ============================================================
  --  PROTOCOLO HORMONAL (5)
  -- ============================================================
  INSERT INTO protocolo_hormonal (protocolo_id, nome, especie, descricao, duracao_dias, hormonios, ativo) VALUES
    (uid_prot1, 'P4+EB 7 dias',          'BOVINO',  'Protocolo com progesterona + benzoato de estradiol', 9,  'P4, EB, PGF2α, eCG', true),
    (uid_prot2, 'Ovsynch Modificado',     'BOVINO',  'GnRH + PGF2α + GnRH em 9 dias',                     9,  'GnRH, PGF2α',        true),
    (uid_prot3, 'IATF Ovinos 14 dias',   'OVINO',   'Esponja de progesterona + eCG',                      16, 'P4, eCG, PGF2α',     true),
    (gen_random_uuid(), 'IATF Caprinos',  'CAPRINO', 'Esponja intravaginal + PMSG',                        11, 'P4, PMSG',           true),
    (gen_random_uuid(), 'Short IATF',     'BOVINO',  'Protocolo encurtado 5 dias',                          7, 'P4, EB, PGF2α',      true);

  -- ============================================================
  --  REPRODUTORES (10 sêmen externo + bovinos/ovinos/caprinos)
  -- ============================================================
  INSERT INTO reprodutores (reprodutor_id, nome, registro, especie, raca, tipo, empresa_semen,
                             dep_peso_desmame, dep_fertilidade, dep_acuracia, ativo) VALUES
    (rep_ids[1],  'Touro Elite Nelore 7023',   'ABCZ-7023',  'BOVINO',  'Nelore',     'SEMEN_EXTERNO', 'CRV Lagoa',      15.2, 8.5, 0.88, true),
    (rep_ids[2],  'Touro Angus Premium',        'ABCZ-9812',  'BOVINO',  'Angus',      'SEMEN_EXTERNO', 'Alta Genetics',  12.8, 9.2, 0.92, true),
    (rep_ids[3],  'Gir Leiteiro Campeão',       'ACGIL-3301', 'BOVINO',  'Gir',        'SEMEN_EXTERNO', 'GenSul',          8.4, 11.3, 0.85, true),
    (rep_ids[4],  'Guzerá Top Gain',            'ABCZ-4490',  'BOVINO',  'Guzerá',     'SEMEN_EXTERNO', 'Sexing Tech',    14.1, 7.8, 0.79, true),
    (rep_ids[5],  'Brahman Red King',            'ABB-2205',   'BOVINO',  'Brahman',    'SEMEN_EXTERNO', 'ABS Global',     11.6, 6.5, 0.72, true),
    (rep_ids[6],  'Bode Dorper Campeão F7',     'ARCO-0812',  'CAPRINO', 'Boer',       'SEMEN_EXTERNO', 'GeneSul Capri',   6.8, 9.1, 0.65, true),
    (rep_ids[7],  'Anglo-nubiano Sultan',        NULL,         'CAPRINO', 'Anglo-nubiano','SEMEN_EXTERNO','CapriSemen',     5.5, 8.7, 0.60, true),
    (rep_ids[8],  'Carneiro Santa Inês Nobre',  'ARCO-3341',  'OVINO',   'Santa Inês', 'SEMEN_EXTERNO', 'OviGenes',        4.2, 7.3, 0.71, true),
    (rep_ids[9],  'Dorper Elite 2024',           'ARCO-9921',  'OVINO',   'Dorper',     'SEMEN_EXTERNO', 'SemenOvi',        5.1, 8.9, 0.68, true),
    (rep_ids[10], 'Simmental Brasileiro',        'ABCZ-6612',  'BOVINO',  'Simmental',  'SEMEN_EXTERNO', 'Genética Total', 13.4, 7.1, 0.83, true);

  -- ============================================================
  --  ANIMAIS — 150 registros (loop)
  --  ~90 BOVINO, ~35 OVINO, ~25 CAPRINO | ~100 FEMEA, ~50 MACHO
  -- ============================================================
  FOR i IN 1..150 LOOP
    v_id := gen_random_uuid();

    -- Determina fazenda (round-robin)
    v_faz_id := fazendas_arr[((i-1) % 5) + 1];

    -- Determina espécie
    IF i <= 90 THEN
      v_especie := 'BOVINO';
    ELSIF i <= 125 THEN
      v_especie := 'OVINO';
    ELSE
      v_especie := 'CAPRINO';
    END IF;

    -- Determina sexo (~2/3 fêmea)
    IF i % 3 = 0 THEN
      v_sexo := 'MACHO';
    ELSE
      v_sexo := 'FEMEA';
    END IF;

    -- Peso por espécie (realístico)
    IF v_especie = 'BOVINO' THEN
      v_peso := 200 + (i % 450)::NUMERIC;  -- 200-650 kg
      v_peso := GREATEST(50, LEAST(900, v_peso));
    ELSIF v_especie = 'OVINO' THEN
      v_peso := 20 + (i % 80)::NUMERIC;    -- 20-100 kg
      v_peso := GREATEST(10, LEAST(120, v_peso));
    ELSE
      v_peso := 12 + (i % 70)::NUMERIC;    -- 12-82 kg
      v_peso := GREATEST(8, LEAST(100, v_peso));
    END IF;

    -- Código do animal
    IF v_especie = 'BOVINO' THEN
      v_codigo := 'BOV-' || LPAD(i::TEXT, 4, '0');
    ELSIF v_especie = 'OVINO' THEN
      v_codigo := 'OVI-' || LPAD((i - 90)::TEXT, 4, '0');
    ELSE
      v_codigo := 'CAP-' || LPAD((i - 125)::TEXT, 4, '0');
    END IF;

    -- Data de nascimento (1 a 6 anos atrás)
    v_data_nasc := CURRENT_DATE - INTERVAL '1 year' - (((i * 11) % 1800) || ' days')::INTERVAL;

    INSERT INTO animais (
      animal_id, fazenda_id, codigo, nome, especie, sexo,
      data_nascimento, raca_principal, peso_inicial_kg,
      condicao_corporal, status, num_partos, ativo
    ) VALUES (
      v_id,
      v_faz_id,
      v_codigo,
      CASE
        WHEN v_sexo = 'FEMEA' THEN nomes_femea[((i-1) % array_length(nomes_femea,1)) + 1]
        ELSE nomes_macho[((i-1) % array_length(nomes_macho,1)) + 1]
      END,
      v_especie::especie_animal,
      v_sexo::sexo_animal,
      v_data_nasc,
      CASE
        WHEN v_especie = 'BOVINO' THEN racas_bov[((i-1) % array_length(racas_bov,1)) + 1]
        WHEN v_especie = 'OVINO'  THEN racas_ovi[((i-1) % array_length(racas_ovi,1)) + 1]
        ELSE racas_cap[((i-1) % array_length(racas_cap,1)) + 1]
      END,
      v_peso,
      1 + (i % 5),  -- condicao_corporal 1-5
      'ATIVA',
      0,
      true
    );

    todas_ids := todas_ids || v_id;
    IF v_sexo = 'FEMEA' THEN
      femea_ids := femea_ids || v_id;
    END IF;
  END LOOP;

  -- ============================================================
  --  DADOS GENÉTICOS (70 registros)
  -- ============================================================
  FOR i IN 1..70 LOOP
    INSERT INTO dados_geneticos (dados_gen_id, animal_id, raca_pai, raca_mae,
      dep_peso_desmame, dep_fertilidade, dep_acuracia, coeficiente_endogamia)
    VALUES (
      gen_random_uuid(),
      todas_ids[i],
      racas_bov[((i-1) % array_length(racas_bov,1)) + 1],
      racas_bov[(i % array_length(racas_bov,1)) + 1],
      8.0 + (i % 12),
      5.0 + (i % 8),
      0.55 + ((i % 40)::NUMERIC / 100),
      CASE WHEN i % 15 = 0 THEN 0.08 ELSE 0.02 + ((i % 5)::NUMERIC / 100) END
    );
  END LOOP;

  -- ============================================================
  --  INSEMINAÇÕES (100 registros) — apenas fêmeas
  -- ============================================================
  FOR i IN 1..100 LOOP
    v_ins_id    := gen_random_uuid();
    v_animal_id := femea_ids[((i-1) % array_length(femea_ids,1)) + 1];
    v_rep_id    := rep_ids[((i-1) % 10) + 1];
    -- Reprodutor compatível: bovinos usam rep 1-5, ovinos 8-9, caprinos 6-7
    -- Simplificado: usa rep[1] para todos (BOVINO sêmen externo funciona)

    -- Ajusta reprodutor por espécie do animal
    SELECT a.especie::TEXT INTO v_especie FROM animais a WHERE a.animal_id = v_animal_id;
    IF v_especie = 'OVINO' THEN
      v_rep_id := rep_ids[(8 + (i % 2))];
    ELSIF v_especie = 'CAPRINO' THEN
      v_rep_id := rep_ids[(6 + (i % 2))];
    ELSE
      v_rep_id := rep_ids[((i-1) % 5) + 1];
    END IF;

    v_data_ins := CURRENT_TIMESTAMP - ((10 + ((i * 7) % 720)) || ' days')::INTERVAL;
    v_resultado := CASE
      WHEN i % 3 = 0 THEN 'PRENHA'
      WHEN i % 5 = 0 THEN 'VAZIA'
      WHEN i % 9 = 0 THEN 'CANCELADA'
      ELSE 'PENDENTE'
    END;

    INSERT INTO inseminacoes (
      inseminacao_id, animal_id, reprodutor_id, tecnico_id,
      protocolo_id, data_inseminacao, tipo,
      condicao_corporal_momento, temperatura_ambiente_c,
      dias_pos_parto, dias_desde_ultima_ins,
      ciclos_sem_concepcao, historico_prenhez,
      resultado
    ) VALUES (
      v_ins_id,
      v_animal_id,
      v_rep_id,
      tec_ids[((i-1) % 3) + 1],
      CASE WHEN i % 4 = 0 THEN uid_prot1 WHEN i % 4 = 1 THEN uid_prot2 ELSE NULL END,
      v_data_ins,
      CASE WHEN i % 4 = 0 THEN 'IATF' WHEN i % 7 = 0 THEN 'TRANSFERENCIA_EMBRIAO' ELSE 'IA_CONVENCIONAL' END::tipo_inseminacao,
      2 + (i % 4),         -- condicao_corporal_momento 2-5
      20.0 + (i % 18),     -- temperatura_ambiente_c
      45 + (i % 120),      -- dias_pos_parto
      25 + (i % 60),       -- dias_desde_ultima_ins
      i % 4,               -- ciclos_sem_concepcao
      GREATEST(0, (i % 5) - 1), -- historico_prenhez
      v_resultado::resultado_inseminacao
    );
  END LOOP;

  -- ============================================================
  --  DIAGNÓSTICOS (70 registros — para inseminações com resultado)
  -- ============================================================
  INSERT INTO diagnosticos (
    diagnostico_id, inseminacao_id, animal_id, data_diagnostico,
    metodo, resultado, dias_gestacao_est, data_parto_prevista, veterinario_id
  )
  SELECT
    gen_random_uuid(),
    ins.inseminacao_id,
    ins.animal_id,
    ins.data_inseminacao::DATE + 30 + (ROW_NUMBER() OVER () % 20)::INT,
    CASE ROW_NUMBER() OVER () % 3
      WHEN 0 THEN 'ULTRASSONOGRAFIA'
      WHEN 1 THEN 'PALPACAO_RETAL'
      ELSE 'EXAME_LABORATORIAL'
    END::metodo_diagnostico,
    ins.resultado::resultado_diagnostico,
    CASE WHEN ins.resultado = 'PRENHA' THEN 30 + (ROW_NUMBER() OVER () % 60)::INT ELSE NULL END,
    CASE WHEN ins.resultado = 'PRENHA' THEN
      ins.data_inseminacao::DATE + (
        CASE
          WHEN a.especie = 'BOVINO' THEN 283
          ELSE 150
        END
      )
    ELSE NULL END,
    vet_ids[(ROW_NUMBER() OVER () % 3 + 1)::INT]
  FROM inseminacoes ins
  JOIN animais a ON a.animal_id = ins.animal_id
  WHERE ins.resultado IN ('PRENHA', 'VAZIA')
  LIMIT 70;

  -- ============================================================
  --  PESAGENS (160 registros — múltiplas por animal)
  -- ============================================================
  FOR i IN 1..160 LOOP
    v_animal_id := todas_ids[((i-1) % 120) + 1];

    SELECT a.especie::TEXT, a.data_nascimento INTO v_especie, v_data_nasc
    FROM animais a WHERE a.animal_id = v_animal_id;

    -- Peso crescente ao longo do tempo
    v_peso := CASE
      WHEN v_especie = 'BOVINO' THEN 60.0 + (i * 3.5) % 600
      WHEN v_especie = 'OVINO'  THEN 15.0 + (i * 1.2) % 80
      ELSE 10.0 + (i * 0.9) % 70
    END;
    v_peso := CASE
      WHEN v_especie = 'BOVINO' THEN GREATEST(50,  LEAST(900, v_peso))
      WHEN v_especie = 'OVINO'  THEN GREATEST(10,  LEAST(120, v_peso))
      ELSE                           GREATEST(8,   LEAST(100, v_peso))
    END;

    INSERT INTO pesagens (pesagem_id, animal_id, data, peso_kg, estagio, observacao)
    VALUES (
      gen_random_uuid(),
      v_animal_id,
      CURRENT_DATE - ((i * 5) % 730 + 1),
      v_peso,
      CASE (i % 5)
        WHEN 0 THEN 'NASCIMENTO'
        WHEN 1 THEN 'DESMAME'
        WHEN 2 THEN 'CRESCIMENTO'
        WHEN 3 THEN 'ADULTO'
        ELSE 'CRESCIMENTO'
      END::estagio_pesagem,
      CASE WHEN i % 8 = 0 THEN 'Pesagem mensal de rotina' ELSE NULL END
    )
    ON CONFLICT (animal_id, data) DO NOTHING;  -- evita duplicata de data
  END LOOP;

  -- ============================================================
  --  PARTOS (40 registros — apenas fêmeas)
  -- ============================================================
  FOR i IN 1..40 LOOP
    v_animal_id := femea_ids[((i-1) % array_length(femea_ids,1)) + 1];

    -- Atualiza animal para refletir partos
    UPDATE animais
    SET num_partos        = num_partos + 1,
        data_ultimo_parto = CURRENT_DATE - ((i * 9) % 365 + 30),
        status            = CASE WHEN i % 5 = 0 THEN 'PRENHA' ELSE 'ATIVA' END::status_animal
    WHERE animal_id = v_animal_id;

    INSERT INTO partos (
      parto_id, animal_id, data_parto, tipo_parto,
      num_crias, num_crias_vivas, peso_total_crias_kg,
      houve_distorcia, houve_obito_matriz
    ) VALUES (
      gen_random_uuid(),
      v_animal_id,
      CURRENT_DATE - ((i * 9) % 365 + 30),
      CASE WHEN i % 12 = 0 THEN 'DUPLO' ELSE 'SIMPLES' END::tipo_parto,
      CASE WHEN i % 12 = 0 THEN 2 ELSE 1 END,
      CASE WHEN i % 12 = 0 THEN (1 + (i % 2)) ELSE 1 END,
      CASE
        WHEN v_especie = 'BOVINO' THEN 35.0 + (i % 15)
        WHEN v_especie = 'OVINO'  THEN 3.5 + (i % 3)
        ELSE 2.8 + (i % 3)
      END,
      (i % 10 = 0),
      false
    );
  END LOOP;

  -- ============================================================
  --  EVENTOS SANITÁRIOS (80 registros)
  -- ============================================================
  FOR i IN 1..80 LOOP
    v_animal_id := todas_ids[((i-1) % 140) + 1];

    INSERT INTO eventos_sanitarios (
      evento_san_id, animal_id, tipo, produto, principio_ativo,
      data_aplicacao, dose, via_administracao, proxima_dose, responsavel_id
    ) VALUES (
      gen_random_uuid(),
      v_animal_id,
      CASE (i % 5)
        WHEN 0 THEN 'VACINA'
        WHEN 1 THEN 'VERMIFUGACAO'
        WHEN 2 THEN 'MEDICACAO'
        WHEN 3 THEN 'EXAME'
        ELSE 'VACINA'
      END::tipo_sanitario,
      CASE (i % 6)
        WHEN 0 THEN 'Aftosa Bivalente'
        WHEN 1 THEN 'Ivermectina 1%'
        WHEN 2 THEN 'Brucelose B19'
        WHEN 3 THEN 'Clostridioses'
        WHEN 4 THEN 'Doramectina'
        ELSE 'Raiva Animal'
      END,
      CASE (i % 6)
        WHEN 1 THEN 'Ivermectina'
        WHEN 4 THEN 'Doramectina'
        ELSE NULL
      END,
      CURRENT_DATE - ((i * 4) % 365 + 1),
      CASE (i % 4) WHEN 0 THEN '5 mL' WHEN 1 THEN '1 mL/50kg' ELSE '2 mL' END,
      CASE (i % 5) WHEN 0 THEN 'SC' WHEN 1 THEN 'IM' WHEN 2 THEN 'IV' ELSE 'ORAL' END::via_administracao,
      CASE WHEN i % 3 = 0 THEN CURRENT_DATE + ((90 + (i % 180)) || ' days')::INTERVAL ELSE NULL END,
      tec_ids[((i-1) % 3) + 1]
    );
  END LOOP;

  -- ============================================================
  --  OCORRÊNCIAS (50 registros)
  -- ============================================================
  FOR i IN 1..50 LOOP
    v_animal_id := todas_ids[((i-1) % 140) + 1];

    INSERT INTO ocorrencias (
      ocorrencia_id, animal_id, data, categoria, titulo, descricao, gravidade, resolvida
    ) VALUES (
      gen_random_uuid(),
      v_animal_id,
      CURRENT_DATE - ((i * 6) % 400 + 1),
      CASE (i % 5)
        WHEN 0 THEN 'SAUDE'
        WHEN 1 THEN 'MANEJO'
        WHEN 2 THEN 'COMPORTAMENTO'
        WHEN 3 THEN 'REPRODUCAO'
        ELSE 'OUTRO'
      END::categoria_ocorrencia,
      CASE (i % 8)
        WHEN 0 THEN 'Coxeira membro posterior direito'
        WHEN 1 THEN 'Baixo consumo de ração'
        WHEN 2 THEN 'Comportamento agressivo'
        WHEN 3 THEN 'Descarga vaginal anormal'
        WHEN 4 THEN 'Ferida por cerca'
        WHEN 5 THEN 'Diarreia leve'
        WHEN 6 THEN 'Perda de condição corporal'
        ELSE 'Abscesso cutâneo'
      END,
      'Observação registrada durante manejo rotineiro. Animal apresentou sinais de alteração ' ||
        CASE (i % 3) WHEN 0 THEN 'desde a última pesagem.' WHEN 1 THEN 'após mudança de pastagem.' ELSE 'sem causa aparente.' END,
      CASE (i % 7) WHEN 0 THEN 'CRITICA' WHEN 1 THEN 'ALTA' WHEN 2 THEN 'MEDIA' ELSE 'BAIXA' END::gravidade_ocorrencia,
      (i % 4 = 0)
    );
  END LOOP;

  -- ============================================================
  --  ALERTAS (40 registros — criados manualmente para o dashboard)
  -- ============================================================
  FOR i IN 1..40 LOOP
    v_animal_id := todas_ids[((i-1) % 100) + 1];

    INSERT INTO alertas (
      alerta_id, animal_id, tipo, mensagem, data_disparo, prioridade, lido, resolvido
    ) VALUES (
      gen_random_uuid(),
      v_animal_id,
      CASE (i % 5)
        WHEN 0 THEN 'DIAGNOSTICO_PENDENTE'
        WHEN 1 THEN 'PROXIMA_DOSE'
        WHEN 2 THEN 'JANELA_IATF'
        WHEN 3 THEN 'OCORRENCIA_CRITICA'
        ELSE 'OUTRO'
      END::tipo_alerta,
      CASE (i % 5)
        WHEN 0 THEN 'Diagnóstico de gestação pendente — inseminação há mais de 30 dias.'
        WHEN 1 THEN 'Próxima dose de vacina prevista para os próximos 7 dias.'
        WHEN 2 THEN 'Janela de IATF aberta — protocolo concluído sem registro de inseminação.'
        WHEN 3 THEN 'Ocorrência crítica não resolvida registrada para este animal.'
        ELSE 'Alerta de manejo geral — verificar animal.'
      END,
      CURRENT_DATE - ((i * 2) % 60) + ((i % 30) || ' days')::INTERVAL,
      CASE (i % 4)
        WHEN 0 THEN 'CRITICA'
        WHEN 1 THEN 'ALTA'
        WHEN 2 THEN 'MEDIA'
        ELSE 'BAIXA'
      END::prioridade_alerta,
      (i % 5 = 0),
      (i % 8 = 0)
    );
  END LOOP;

  -- ============================================================
  --  ANÁLISES IA (30 registros)
  -- ============================================================
  FOR i IN 1..30 LOOP
    v_animal_id := femea_ids[((i-1) % array_length(femea_ids,1)) + 1];

    INSERT INTO analises_ia (
      analise_id, animal_id, tecnico_id, score_prenhez,
      fatores_influentes, parametros_entrada
    ) VALUES (
      gen_random_uuid(),
      v_animal_id,
      tec_ids[((i-1) % 3) + 1],
      ROUND((0.40 + (i * 0.018) % 0.58)::NUMERIC, 4),
      jsonb_build_object(
        'condicao_corporal',   2 + (i % 4),
        'intervalo_pos_parto', 45 + (i % 120),
        'temperatura_c',       22 + (i % 16)
      ),
      jsonb_build_object(
        'motor',        'rules_v1.0',
        'especie',      CASE (i % 3) WHEN 0 THEN 'BOVINO' WHEN 1 THEN 'OVINO' ELSE 'CAPRINO' END,
        'classificacao', CASE WHEN (0.40 + (i * 0.018) % 0.58) >= 0.70 THEN 'FAVORAVEL'
                              WHEN (0.40 + (i * 0.018) % 0.58) >= 0.50 THEN 'MEDIO'
                              ELSE 'DESFAVORAVEL' END
      )
    );
  END LOOP;

  -- ============================================================
  --  ALIMENTAÇÕES (30 registros — planos básicos)
  -- ============================================================
  FOR i IN 1..30 LOOP
    INSERT INTO alimentacoes (alimentacao_id, animal_id, data_inicio, tipo, descricao, custo_diario)
    VALUES (
      gen_random_uuid(),
      todas_ids[((i-1) % 100) + 1],
      CURRENT_DATE - ((i * 12) % 365 + 1),
      CASE (i % 4)
        WHEN 0 THEN 'PASTO'
        WHEN 1 THEN 'SUPLEMENTACAO'
        WHEN 2 THEN 'CONFINAMENTO'
        ELSE 'MISTO'
      END::tipo_alimentacao,
      CASE (i % 4)
        WHEN 0 THEN 'Capim Tifton 85 — pastagem rotacionada'
        WHEN 1 THEN 'Suplemento mineral proteico 100g/dia'
        WHEN 2 THEN 'Silagem milho 8kg + concentrado 2kg'
        ELSE 'Pastagem + suplemento mineral'
      END,
      CASE (i % 4)
        WHEN 0 THEN 1.50
        WHEN 1 THEN 2.80
        WHEN 2 THEN 12.50
        ELSE 3.20
      END
    );
  END LOOP;

  RAISE NOTICE '✓ Seed concluído com sucesso!';
  RAISE NOTICE '  Usuários:           10';
  RAISE NOTICE '  Fazendas:           5';
  RAISE NOTICE '  Reprodutores:       10';
  RAISE NOTICE '  Protocolos:         5';
  RAISE NOTICE '  Animais:            150';
  RAISE NOTICE '  Dados Genéticos:    70';
  RAISE NOTICE '  Inseminações:       100';
  RAISE NOTICE '  Diagnósticos:       ~70';
  RAISE NOTICE '  Partos:             40';
  RAISE NOTICE '  Pesagens:           ~160';
  RAISE NOTICE '  Eventos Sanitários: 80';
  RAISE NOTICE '  Ocorrências:        50';
  RAISE NOTICE '  Alertas:            40';
  RAISE NOTICE '  Análises IA:        30';
  RAISE NOTICE '  Alimentações:       30';

END;
$$;

COMMIT;
