BEGIN;

-- ============================================================
--  EXTENSÕES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
--  FUNÇÕES UTILITÁRIAS
--  Declaradas antes das tabelas para estarem disponíveis
--  nos triggers ao longo do script.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_validar_sexo_inseminacao()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT sexo FROM animais WHERE animal_id = NEW.animal_id) <> 'FEMEA' THEN
        RAISE EXCEPTION 'Apenas fêmeas podem ser inseminadas.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  ENUMS
--  Cada tipo declarado uma única vez.
-- ============================================================

CREATE TYPE perfil               AS ENUM ('ADMIN', 'PRODUTOR', 'TECNICO', 'VETERINARIO');
CREATE TYPE acao_log             AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FALHOU');
CREATE TYPE tipo_producao        AS ENUM ('CORTE', 'LEITE', 'MISTO', 'SUBSISTENCIA');
CREATE TYPE especie_animal       AS ENUM ('BOVINO', 'OVINO', 'CAPRINO');
CREATE TYPE sexo_animal          AS ENUM ('MACHO', 'FEMEA');
CREATE TYPE status_animal        AS ENUM ('ATIVA', 'PRENHA', 'EM_REPOUSO', 'DESCARTADA', 'REPRODUTOR_ATIVO', 'EM_MONITORAMENTO');
CREATE TYPE tipo_reprodutor      AS ENUM ('SEMEN_EXTERNO', 'ANIMAL_PROPRIO');
CREATE TYPE tipo_inseminacao     AS ENUM ('IA_CONVENCIONAL', 'IATF', 'TRANSFERENCIA_EMBRIAO');
CREATE TYPE resultado_inseminacao AS ENUM ('PENDENTE', 'PRENHA', 'VAZIA', 'INCONCLUSIVO', 'CANCELADA');
CREATE TYPE metodo_diagnostico   AS ENUM ('PALPACAO_RETAL', 'ULTRASSONOGRAFIA', 'EXAME_LABORATORIAL');
CREATE TYPE resultado_diagnostico AS ENUM ('PRENHA', 'VAZIA', 'INCONCLUSIVO');
CREATE TYPE tipo_parto           AS ENUM ('SIMPLES', 'DUPLO', 'MULTIPLO');
CREATE TYPE estagio_pesagem      AS ENUM ('NASCIMENTO', 'DESMAME', 'CRESCIMENTO', 'ADULTO', 'ABATE');
CREATE TYPE tipo_sanitario       AS ENUM ('VACINA', 'VERMIFUGACAO', 'MEDICACAO', 'EXAME', 'OUTRO');
CREATE TYPE via_administracao    AS ENUM ('SC', 'IM', 'IV', 'ORAL', 'TOPICA');
CREATE TYPE tipo_alerta          AS ENUM ('DIAGNOSTICO_PENDENTE', 'PROXIMA_DOSE', 'JANELA_IATF', 'OCORRENCIA_CRITICA', 'OUTRO');
CREATE TYPE prioridade_alerta    AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');
CREATE TYPE tipo_alimentacao     AS ENUM ('PASTO', 'CONFINAMENTO', 'SUPLEMENTACAO', 'MISTO');
CREATE TYPE categoria_ocorrencia  AS ENUM ('SAUDE', 'MANEJO', 'COMPORTAMENTO', 'REPRODUCAO', 'OUTRO');
CREATE TYPE gravidade_ocorrencia  AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');


-- ============================================================
--  ENT-01  USUÁRIOS
-- ============================================================

CREATE TABLE usuarios (
    usuario_id       UUID         DEFAULT gen_random_uuid(),
    nome             VARCHAR(150) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    senha_hash       VARCHAR(255),
    cpf              VARCHAR(11)  NOT NULL,
    telefone         VARCHAR(20),
    perfil           perfil       NOT NULL,
    ativo            BOOLEAN      NOT NULL DEFAULT TRUE,
    tentativas_login INTEGER      NOT NULL DEFAULT 0,
    bloqueado_ate    TIMESTAMP,
    ultimo_acesso    TIMESTAMP,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_usuario       PRIMARY KEY (usuario_id),
    CONSTRAINT uq_usuario_email UNIQUE (email),
    CONSTRAINT uq_usuario_cpf   UNIQUE (cpf)
);

CREATE TRIGGER trg_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================
--  ENT-15  AUDIT LOG
--  Criado cedo para que todas as entidades possam referenciar
--  usuários já existentes quando necessário.
-- ============================================================

CREATE TABLE audit_log (
    log_id      UUID      DEFAULT gen_random_uuid(),
    usuario_id  UUID,
    acao        acao_log  NOT NULL,
    entidade    VARCHAR(60),
    entidade_id UUID,
    dados_antes  JSONB,
    dados_depois JSONB,
    ip_origem   VARCHAR(45),
    user_agent  VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_audit_log PRIMARY KEY (log_id),
    CONSTRAINT fk_log_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (usuario_id)
        ON DELETE SET NULL,
    CONSTRAINT chk_log_entidade CHECK (
        (acao IN ('LOGIN', 'LOGOUT', 'LOGIN_FALHOU') AND entidade IS NULL)
        OR
        (acao NOT IN ('LOGIN', 'LOGOUT', 'LOGIN_FALHOU') AND entidade IS NOT NULL)
    )
);

CREATE INDEX idx_log_usuario_id ON audit_log(usuario_id) WHERE usuario_id IS NOT NULL;
CREATE INDEX idx_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_log_entidade   ON audit_log(entidade, entidade_id);

CREATE OR REPLACE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE OR REPLACE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- Purge de dados pessoais (LGPD art. 6º — retenção 12 meses).
-- SECURITY DEFINER contorna a RULE de bloqueio acima.
-- Agendar mensalmente via pg_cron ou Spring @Scheduled.
CREATE OR REPLACE FUNCTION fn_purge_audit_log_pii()
RETURNS void
SECURITY DEFINER
LANGUAGE sql AS $$
    UPDATE audit_log
    SET    ip_origem  = NULL,
           user_agent = NULL
    WHERE  created_at < CURRENT_TIMESTAMP - INTERVAL '12 months'
      AND  ip_origem IS NOT NULL;
$$;


-- ============================================================
--  ENT-02  FAZENDAS
-- ============================================================

CREATE TABLE fazendas (
    fazenda_id         UUID          DEFAULT gen_random_uuid(),
    usuario_id         UUID          NOT NULL,
    nome               VARCHAR(120)  NOT NULL,
    municipio          VARCHAR(100)  NOT NULL,
    estado             CHAR(2)       NOT NULL,
    latitude           DECIMAL(9, 6),
    longitude          DECIMAL(9, 6),
    area_hectares      DECIMAL(10, 2),
    tipo_producao      tipo_producao,
    capacidade_rebanho INTEGER,
    ativo              BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_fazenda               PRIMARY KEY (fazenda_id),
    CONSTRAINT uq_fazenda_nome_produtor UNIQUE (usuario_id, nome),
    CONSTRAINT chk_fazenda_estado CHECK (estado IN (
        'AC','AL','AP','AM','BA','CE','DF','ES','GO',
        'MA','MT','MS','MG','PA','PB','PR','PE','PI',
        'RJ','RN','RS','RO','RR','SC','SP','SE','TO'
    )),
    CONSTRAINT chk_fazenda_coords CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude IS NOT NULL AND longitude IS NOT NULL)
    ),
    CONSTRAINT chk_fazenda_capacidade CHECK (capacidade_rebanho IS NULL OR capacidade_rebanho > 0),
    CONSTRAINT fk_fazenda_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (usuario_id)
        ON DELETE RESTRICT
);

CREATE TRIGGER trg_fazendas_updated_at
    BEFORE UPDATE ON fazendas
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_fazendas_usuario_id ON fazendas(usuario_id);
CREATE INDEX idx_fazendas_estado     ON fazendas(estado);


-- ============================================================
--  ENT-03  ANIMAIS
-- ============================================================

CREATE TABLE animais (
    animal_id         UUID           DEFAULT gen_random_uuid(),
    fazenda_id        UUID           NOT NULL,
    codigo            VARCHAR(20)    NOT NULL,
    nome              VARCHAR(100)   NOT NULL,
    especie           especie_animal NOT NULL,
    sexo              sexo_animal    NOT NULL,
    data_nascimento   DATE           NOT NULL,
    raca_principal    VARCHAR(80),
    peso_inicial_kg   DECIMAL(6, 2)  NOT NULL,
    condicao_corporal SMALLINT       NOT NULL,
    brinco            VARCHAR(50),
    status            status_animal  NOT NULL DEFAULT 'ATIVA',
    num_partos        INTEGER        NOT NULL DEFAULT 0,
    data_ultimo_parto DATE,
    observacoes       TEXT,
    ativo             BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_animal                PRIMARY KEY (animal_id),
    CONSTRAINT uq_animal_codigo_fazenda UNIQUE (fazenda_id, codigo),
    CONSTRAINT chk_animal_condicao_corporal CHECK (condicao_corporal BETWEEN 1 AND 5),
    CONSTRAINT chk_animal_peso_bovino       CHECK (especie <> 'BOVINO'  OR peso_inicial_kg BETWEEN 50 AND 900),
    CONSTRAINT chk_animal_peso_ovino        CHECK (especie <> 'OVINO'   OR peso_inicial_kg BETWEEN 10 AND 120),
    CONSTRAINT chk_animal_peso_caprino      CHECK (especie <> 'CAPRINO' OR peso_inicial_kg BETWEEN 8  AND 100),
    CONSTRAINT chk_animal_partos_femea      CHECK (sexo = 'FEMEA' OR num_partos = 0),
    CONSTRAINT fk_animal_fazenda
        FOREIGN KEY (fazenda_id)
        REFERENCES fazendas (fazenda_id)
        ON DELETE RESTRICT
);

CREATE UNIQUE INDEX uq_animal_brinco
    ON animais (brinco)
    WHERE brinco IS NOT NULL;

CREATE TRIGGER trg_animais_updated_at
    BEFORE UPDATE ON animais
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_animais_fazenda_id      ON animais(fazenda_id);
CREATE INDEX idx_animais_status          ON animais(status) WHERE ativo = TRUE;
CREATE INDEX idx_animais_especie_fazenda ON animais(fazenda_id, especie);


-- ============================================================
--  ENT-04  DADOS GENÉTICOS
-- ============================================================

CREATE TABLE dados_geneticos (
    dados_gen_id          UUID      DEFAULT gen_random_uuid(),
    animal_id             UUID      NOT NULL,
    raca_pai              VARCHAR(80),
    raca_mae              VARCHAR(80),
    percentual_sangue     VARCHAR(60),
    pai_id                UUID,
    mae_id                UUID,
    dep_peso_desmame      DECIMAL(6, 2),
    dep_peso_sobrean      DECIMAL(6, 2),
    dep_fertilidade       DECIMAL(5, 2),
    dep_acuracia          DECIMAL(4, 3),
    coeficiente_endogamia DECIMAL(5, 4),
    heterose_esperada     DECIMAL(5, 2),
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_dados_gen        PRIMARY KEY (dados_gen_id),
    CONSTRAINT uq_dados_gen_animal UNIQUE (animal_id),
    CONSTRAINT chk_dep_acuracia    CHECK (dep_acuracia IS NULL OR dep_acuracia BETWEEN 0.000 AND 1.000),
    CONSTRAINT chk_coef_endogamia  CHECK (coeficiente_endogamia IS NULL OR coeficiente_endogamia BETWEEN 0.0000 AND 1.0000),
    CONSTRAINT fk_dados_gen_animal
        FOREIGN KEY (animal_id) REFERENCES animais (animal_id) ON DELETE CASCADE,
    CONSTRAINT fk_dados_gen_pai
        FOREIGN KEY (pai_id)    REFERENCES animais (animal_id) ON DELETE SET NULL,
    CONSTRAINT fk_dados_gen_mae
        FOREIGN KEY (mae_id)    REFERENCES animais (animal_id) ON DELETE SET NULL
);

CREATE TRIGGER trg_dados_gen_updated_at
    BEFORE UPDATE ON dados_geneticos
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_dados_gen_pai_id ON dados_geneticos(pai_id) WHERE pai_id IS NOT NULL;
CREATE INDEX idx_dados_gen_mae_id ON dados_geneticos(mae_id) WHERE mae_id IS NOT NULL;


-- ============================================================
--  ENT-05  REPRODUTORES
-- ============================================================

CREATE TABLE reprodutores (
    reprodutor_id    UUID            DEFAULT gen_random_uuid(),
    nome             VARCHAR(120)    NOT NULL,
    registro         VARCHAR(60),
    especie          especie_animal  NOT NULL,
    raca             VARCHAR(80)     NOT NULL,
    tipo             tipo_reprodutor NOT NULL,
    animal_id        UUID,
    empresa_semen    VARCHAR(120),
    dep_peso_desmame DECIMAL(6, 2),
    dep_fertilidade  DECIMAL(5, 2),
    dep_acuracia     DECIMAL(4, 3),
    ativo            BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_reprodutor PRIMARY KEY (reprodutor_id),
    CONSTRAINT chk_reprodutor_animal_proprio CHECK (tipo <> 'ANIMAL_PROPRIO' OR animal_id IS NOT NULL),
    CONSTRAINT chk_reprodutor_semen_externo  CHECK (tipo <> 'SEMEN_EXTERNO'  OR animal_id IS NULL),
    CONSTRAINT chk_reprodutor_dep_acuracia   CHECK (dep_acuracia IS NULL OR dep_acuracia BETWEEN 0.000 AND 1.000),
    CONSTRAINT fk_reprodutor_animal
        FOREIGN KEY (animal_id) REFERENCES animais (animal_id) ON DELETE RESTRICT
);

CREATE INDEX idx_reprodutores_animal_id ON reprodutores(animal_id) WHERE animal_id IS NOT NULL;
CREATE INDEX idx_reprodutores_especie   ON reprodutores(especie)    WHERE ativo = TRUE;


-- ============================================================
--  ENT-08  PROTOCOLO HORMONAL
--  Antes de inseminacoes (FK protocolo_id).
-- ============================================================

CREATE TABLE protocolo_hormonal (
    protocolo_id UUID           DEFAULT gen_random_uuid(),
    nome         VARCHAR(100)   NOT NULL,
    especie      especie_animal NOT NULL,
    descricao    TEXT,
    duracao_dias SMALLINT       NOT NULL,
    hormonios    VARCHAR(255),
    observacoes  TEXT,
    ativo        BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_protocolo              PRIMARY KEY (protocolo_id),
    CONSTRAINT uq_protocolo_nome_especie UNIQUE (nome, especie),
    CONSTRAINT chk_protocolo_duracao     CHECK (duracao_dias > 0)
);

CREATE INDEX idx_protocolo_especie ON protocolo_hormonal(especie) WHERE ativo = TRUE;


-- ============================================================
--  ENT-06  INSEMINAÇÕES
-- ============================================================

CREATE TABLE inseminacoes (
    inseminacao_id            UUID                  DEFAULT gen_random_uuid(),
    animal_id                 UUID                  NOT NULL,
    reprodutor_id             UUID                  NOT NULL,
    tecnico_id                UUID                  NOT NULL,
    protocolo_id              UUID,
    data_inseminacao          TIMESTAMP             NOT NULL,
    tipo                      tipo_inseminacao      NOT NULL,
    condicao_corporal_momento SMALLINT              NOT NULL,
    temperatura_ambiente_c    DECIMAL(4, 1),
    dias_pos_parto            INTEGER,
    dias_desde_ultima_ins     INTEGER,
    ciclos_sem_concepcao      SMALLINT              NOT NULL DEFAULT 0,
    historico_prenhez         SMALLINT              NOT NULL DEFAULT 0,
    observacoes               TEXT,
    resultado                 resultado_inseminacao NOT NULL DEFAULT 'PENDENTE',
    created_at                TIMESTAMP             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP             NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_inseminacao PRIMARY KEY (inseminacao_id),
    CONSTRAINT chk_ins_condicao_corporal   CHECK (condicao_corporal_momento BETWEEN 1 AND 5),
    CONSTRAINT chk_ins_dias_pos_parto      CHECK (dias_pos_parto IS NULL OR dias_pos_parto >= 0),
    CONSTRAINT chk_ins_dias_ultima         CHECK (dias_desde_ultima_ins IS NULL OR dias_desde_ultima_ins >= 0),
    CONSTRAINT chk_ins_ciclos              CHECK (ciclos_sem_concepcao >= 0),
    CONSTRAINT chk_ins_historico           CHECK (historico_prenhez >= 0),
    CONSTRAINT chk_ins_protocolo           CHECK (tipo <> 'IATF' OR protocolo_id IS NOT NULL),
    CONSTRAINT fk_ins_animal
        FOREIGN KEY (animal_id)      REFERENCES animais            (animal_id)      ON DELETE RESTRICT,
    CONSTRAINT fk_ins_reprodutor
        FOREIGN KEY (reprodutor_id)  REFERENCES reprodutores       (reprodutor_id)  ON DELETE RESTRICT,
    CONSTRAINT fk_ins_tecnico
        FOREIGN KEY (tecnico_id)     REFERENCES usuarios           (usuario_id)     ON DELETE RESTRICT,
    CONSTRAINT fk_ins_protocolo
        FOREIGN KEY (protocolo_id)   REFERENCES protocolo_hormonal (protocolo_id)   ON DELETE RESTRICT
);

CREATE TRIGGER trg_inseminacoes_updated_at
    BEFORE UPDATE ON inseminacoes
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_ins_validar_sexo
    BEFORE INSERT ON inseminacoes
    FOR EACH ROW EXECUTE FUNCTION fn_validar_sexo_inseminacao();

CREATE INDEX idx_ins_animal_id     ON inseminacoes(animal_id);
CREATE INDEX idx_ins_reprodutor_id ON inseminacoes(reprodutor_id);
CREATE INDEX idx_ins_tecnico_id    ON inseminacoes(tecnico_id);
CREATE INDEX idx_ins_data          ON inseminacoes(data_inseminacao DESC);
CREATE INDEX idx_ins_resultado     ON inseminacoes(resultado) WHERE resultado = 'PENDENTE';
CREATE INDEX idx_ins_protocolo_id  ON inseminacoes(protocolo_id) WHERE protocolo_id IS NOT NULL;


-- ============================================================
--  ENT-09  PARTOS
--  Após inseminacoes — FK inseminacao_id.
-- ============================================================

CREATE TABLE partos (
    parto_id            UUID       DEFAULT gen_random_uuid(),
    animal_id           UUID       NOT NULL,
    inseminacao_id      UUID,
    data_parto          DATE       NOT NULL,
    tipo_parto          tipo_parto NOT NULL,
    num_crias           SMALLINT   NOT NULL,
    num_crias_vivas     SMALLINT   NOT NULL,
    peso_total_crias_kg DECIMAL(6, 2),
    houve_distorcia     BOOLEAN    NOT NULL DEFAULT FALSE,
    houve_obito_matriz  BOOLEAN    NOT NULL DEFAULT FALSE,
    observacoes         TEXT,
    created_at          TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_parto             PRIMARY KEY (parto_id),
    CONSTRAINT uq_parto_inseminacao UNIQUE (inseminacao_id),
    CONSTRAINT chk_parto_num_crias      CHECK (num_crias >= 1),
    CONSTRAINT chk_parto_crias_vivas    CHECK (num_crias_vivas >= 0 AND num_crias_vivas <= num_crias),
    CONSTRAINT chk_parto_tipo_simples   CHECK (tipo_parto <> 'SIMPLES'  OR num_crias = 1),
    CONSTRAINT chk_parto_tipo_duplo     CHECK (tipo_parto <> 'DUPLO'    OR num_crias = 2),
    CONSTRAINT chk_parto_tipo_multiplo  CHECK (tipo_parto <> 'MULTIPLO' OR num_crias >= 3),
    CONSTRAINT chk_parto_peso           CHECK (peso_total_crias_kg IS NULL OR peso_total_crias_kg > 0),
    CONSTRAINT fk_parto_animal
        FOREIGN KEY (animal_id)     REFERENCES animais      (animal_id)     ON DELETE RESTRICT,
    CONSTRAINT fk_parto_inseminacao
        FOREIGN KEY (inseminacao_id) REFERENCES inseminacoes (inseminacao_id) ON DELETE SET NULL
);

CREATE INDEX idx_partos_animal_id ON partos(animal_id);
CREATE INDEX idx_partos_data      ON partos(data_parto DESC);

-- Ocorrências do diário de bordo (registros livres por animal)
CREATE TABLE ocorrencias (
    ocorrencia_id UUID                  DEFAULT gen_random_uuid(),
    animal_id     UUID                  NOT NULL,
    data          DATE                  NOT NULL,
    categoria     categoria_ocorrencia  NOT NULL,
    titulo        VARCHAR(150)          NOT NULL,
    descricao     TEXT                  NOT NULL,
    gravidade     gravidade_ocorrencia,
    resolvida     BOOLEAN               NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP             NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_ocorrencia PRIMARY KEY (ocorrencia_id),
    CONSTRAINT fk_ocorrencia_animal
        FOREIGN KEY (animal_id) REFERENCES animais (animal_id) ON DELETE RESTRICT
);

CREATE INDEX idx_ocorrencias_animal_id ON ocorrencias(animal_id);
CREATE INDEX idx_ocorrencias_data      ON ocorrencias(data DESC);

CREATE OR REPLACE FUNCTION fn_pos_parto()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE animais
    SET    num_partos        = num_partos + 1,
           data_ultimo_parto = NEW.data_parto,
           status            = CASE WHEN NEW.houve_obito_matriz THEN 'DESCARTADA'::status_animal ELSE 'ATIVA'::status_animal END,
           ativo             = CASE WHEN NEW.houve_obito_matriz THEN FALSE ELSE ativo END,
           updated_at        = CURRENT_TIMESTAMP
    WHERE  animal_id = NEW.animal_id;

    IF NEW.inseminacao_id IS NOT NULL THEN
        UPDATE inseminacoes
        SET    resultado  = 'PRENHA',
               updated_at = CURRENT_TIMESTAMP
        WHERE  inseminacao_id = NEW.inseminacao_id
          AND  resultado     <> 'PRENHA';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pos_parto
    AFTER INSERT ON partos
    FOR EACH ROW EXECUTE FUNCTION fn_pos_parto();


-- ============================================================
--  ENT-07  DIAGNÓSTICOS
-- ============================================================

CREATE TABLE diagnosticos (
    diagnostico_id      UUID                  DEFAULT gen_random_uuid(),
    inseminacao_id      UUID                  NOT NULL,
    animal_id           UUID                  NOT NULL,
    data_diagnostico    DATE                  NOT NULL,
    metodo              metodo_diagnostico    NOT NULL,
    resultado           resultado_diagnostico NOT NULL,
    dias_gestacao_est   INTEGER,
    data_parto_prevista DATE,
    veterinario_id      UUID,
    observacoes         TEXT,
    created_at          TIMESTAMP             NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_diagnostico                 PRIMARY KEY (diagnostico_id),
    CONSTRAINT uq_diagnostico_inseminacao     UNIQUE (inseminacao_id),
    CONSTRAINT chk_diag_dias_gestacao         CHECK (dias_gestacao_est IS NULL OR dias_gestacao_est > 0),
    CONSTRAINT chk_diag_parto_prevista        CHECK (data_parto_prevista IS NULL OR data_parto_prevista > data_diagnostico),
    CONSTRAINT fk_diag_inseminacao
        FOREIGN KEY (inseminacao_id) REFERENCES inseminacoes (inseminacao_id) ON DELETE RESTRICT,
    CONSTRAINT fk_diag_animal
        FOREIGN KEY (animal_id)      REFERENCES animais       (animal_id)      ON DELETE RESTRICT,
    CONSTRAINT fk_diag_veterinario
        FOREIGN KEY (veterinario_id) REFERENCES usuarios      (usuario_id)     ON DELETE SET NULL
);

CREATE INDEX idx_diag_animal_id ON diagnosticos(animal_id);
CREATE INDEX idx_diag_resultado ON diagnosticos(resultado);

CREATE OR REPLACE FUNCTION fn_validar_data_diagnostico()
RETURNS TRIGGER AS $$
DECLARE
    v_data_ins TIMESTAMP;
BEGIN
    SELECT data_inseminacao INTO v_data_ins
    FROM   inseminacoes
    WHERE  inseminacao_id = NEW.inseminacao_id;

    IF NEW.data_diagnostico::TIMESTAMP <= v_data_ins THEN
        RAISE EXCEPTION 'data_diagnostico deve ser posterior à data_inseminacao (%).', v_data_ins;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_diag_validar_data
    BEFORE INSERT ON diagnosticos
    FOR EACH ROW EXECUTE FUNCTION fn_validar_data_diagnostico();

CREATE OR REPLACE FUNCTION fn_propagar_resultado_diagnostico()
RETURNS TRIGGER AS $$
BEGIN

    IF NEW.resultado = 'PRENHA' THEN
        UPDATE animais
        SET    status     = 'PRENHA',
               updated_at = CURRENT_TIMESTAMP
        WHERE  animal_id = NEW.animal_id;

    ELSIF NEW.resultado = 'VAZIA' THEN
        UPDATE animais
        SET    status     = 'ATIVA',
               updated_at = CURRENT_TIMESTAMP
        WHERE  animal_id = NEW.animal_id
          AND  status    = 'PRENHA';
    END IF;

	-- Só propaga se o resultado for conclusivo
	IF NEW.resultado IN ('PRENHA', 'VAZIA') THEN
	    UPDATE inseminacoes
	    SET    resultado  = NEW.resultado::TEXT::resultado_inseminacao,
	           updated_at = CURRENT_TIMESTAMP
	    WHERE  inseminacao_id = NEW.inseminacao_id;
	END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_diag_propagar_resultado
    AFTER INSERT ON diagnosticos
    FOR EACH ROW EXECUTE FUNCTION fn_propagar_resultado_diagnostico();


-- ============================================================
--  ENT-10  PESAGENS
-- ============================================================

CREATE TABLE pesagens (
    pesagem_id    UUID            DEFAULT gen_random_uuid(),
    animal_id     UUID            NOT NULL,
    data          DATE            NOT NULL,
    peso_kg       DECIMAL(6, 2)   NOT NULL,
    estagio       estagio_pesagem NOT NULL,
    gmd_calculado DECIMAL(5, 3),
    observacao    VARCHAR(255),
    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_pesagem             PRIMARY KEY (pesagem_id),
    CONSTRAINT uq_pesagem_animal_data UNIQUE (animal_id, data),
    CONSTRAINT chk_pesagem_peso       CHECK (peso_kg > 0),
    CONSTRAINT fk_pesagem_animal
        FOREIGN KEY (animal_id) REFERENCES animais (animal_id) ON DELETE RESTRICT
);

CREATE INDEX idx_pesagens_animal_data ON pesagens(animal_id, data DESC);

CREATE OR REPLACE FUNCTION fn_validar_pesagem()
RETURNS TRIGGER AS $$
DECLARE
    v_nascimento DATE;
    v_especie    especie_animal;
    v_peso_ant   DECIMAL(6, 2);
    v_data_ant   DATE;
    v_dias       INTEGER;
BEGIN
    SELECT data_nascimento, especie
    INTO   v_nascimento, v_especie
    FROM   animais
    WHERE  animal_id = NEW.animal_id;

    IF NEW.data < v_nascimento THEN
        RAISE EXCEPTION 'Data da pesagem (%) anterior ao nascimento do animal (%).', NEW.data, v_nascimento;
    END IF;

    IF v_especie = 'BOVINO'  AND NEW.peso_kg NOT BETWEEN 50 AND 900 THEN
        RAISE EXCEPTION 'Peso fora da faixa para BOVINO (50–900 kg): % kg.', NEW.peso_kg;
    END IF;
    IF v_especie = 'OVINO'   AND NEW.peso_kg NOT BETWEEN 10 AND 120 THEN
        RAISE EXCEPTION 'Peso fora da faixa para OVINO (10–120 kg): % kg.', NEW.peso_kg;
    END IF;
    IF v_especie = 'CAPRINO' AND NEW.peso_kg NOT BETWEEN 8  AND 100 THEN
        RAISE EXCEPTION 'Peso fora da faixa para CAPRINO (8–100 kg): % kg.', NEW.peso_kg;
    END IF;

    SELECT peso_kg, data
    INTO   v_peso_ant, v_data_ant
    FROM   pesagens
    WHERE  animal_id = NEW.animal_id
      AND  data < NEW.data
    ORDER BY data DESC
    LIMIT 1;

    IF v_peso_ant IS NOT NULL THEN
        v_dias := NEW.data - v_data_ant;
        IF v_dias > 0 THEN
            NEW.gmd_calculado := ROUND((NEW.peso_kg - v_peso_ant) / v_dias, 3);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_pesagem
    BEFORE INSERT ON pesagens
    FOR EACH ROW EXECUTE FUNCTION fn_validar_pesagem();


-- ============================================================
--  ENT-11  EVENTOS SANITÁRIOS
-- ============================================================

CREATE TABLE eventos_sanitarios (
    evento_san_id     UUID              DEFAULT gen_random_uuid(),
    animal_id         UUID              NOT NULL,
    tipo              tipo_sanitario    NOT NULL,
    produto           VARCHAR(120)      NOT NULL,
    principio_ativo   VARCHAR(120),
    data_aplicacao    DATE              NOT NULL,
    dose              VARCHAR(60),
    via_administracao via_administracao,
    lote_produto      VARCHAR(60),
    proxima_dose      DATE,
    responsavel_id    UUID              NOT NULL,
    observacoes       TEXT,
    created_at        TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_evento_san           PRIMARY KEY (evento_san_id),
    CONSTRAINT chk_san_proxima_dose    CHECK (proxima_dose IS NULL OR proxima_dose > data_aplicacao),
    CONSTRAINT fk_san_animal
        FOREIGN KEY (animal_id)      REFERENCES animais  (animal_id)  ON DELETE RESTRICT,
    CONSTRAINT fk_san_responsavel
        FOREIGN KEY (responsavel_id) REFERENCES usuarios (usuario_id) ON DELETE RESTRICT
);

CREATE INDEX idx_san_animal_id    ON eventos_sanitarios(animal_id);
CREATE INDEX idx_san_proxima_dose ON eventos_sanitarios(proxima_dose) WHERE proxima_dose IS NOT NULL;


-- ============================================================
--  ENT-14  ALERTAS
--  Criado antes do trigger de eventos_sanitarios que insere aqui.
-- ============================================================

CREATE TABLE alertas (
    alerta_id      UUID              DEFAULT gen_random_uuid(),
    animal_id      UUID,
    inseminacao_id UUID,
    sanitario_id   UUID,
    tipo           tipo_alerta       NOT NULL,
    mensagem       VARCHAR(500)      NOT NULL,
    data_disparo   DATE              NOT NULL,
    prioridade     prioridade_alerta NOT NULL DEFAULT 'MEDIA',
    lido           BOOLEAN           NOT NULL DEFAULT FALSE,
    resolvido      BOOLEAN           NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_alerta PRIMARY KEY (alerta_id),
    CONSTRAINT fk_alerta_animal
        FOREIGN KEY (animal_id)      REFERENCES animais            (animal_id)      ON DELETE CASCADE,
    CONSTRAINT fk_alerta_inseminacao
        FOREIGN KEY (inseminacao_id) REFERENCES inseminacoes       (inseminacao_id) ON DELETE CASCADE,
    CONSTRAINT fk_alerta_sanitario
        FOREIGN KEY (sanitario_id)   REFERENCES eventos_sanitarios (evento_san_id)  ON DELETE CASCADE
);

CREATE INDEX idx_alertas_animal_id ON alertas(animal_id)   WHERE animal_id IS NOT NULL;
CREATE INDEX idx_alertas_pendentes ON alertas(data_disparo) WHERE resolvido = FALSE;
CREATE INDEX idx_alertas_nao_lidos ON alertas(animal_id, data_disparo)
    WHERE lido = FALSE AND resolvido = FALSE;

-- Trigger de alerta de próxima dose — declarado após alertas existir.
CREATE OR REPLACE FUNCTION fn_alerta_proxima_dose()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.proxima_dose IS NOT NULL AND
       (TG_OP = 'INSERT' OR NEW.proxima_dose IS DISTINCT FROM OLD.proxima_dose)
    THEN
        INSERT INTO alertas (
            animal_id,
            sanitario_id,
            tipo,
            mensagem,
            data_disparo,
            prioridade
        ) VALUES (
            NEW.animal_id,
            NEW.evento_san_id,
            'PROXIMA_DOSE',
            'Próxima dose de ' || NEW.produto || ' prevista para ' ||
                TO_CHAR(NEW.proxima_dose, 'DD/MM/YYYY') || '.',
            (NEW.proxima_dose - INTERVAL '7 days')::DATE,  -- ← apenas o valor
            'MEDIA'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_san_alerta_proxima_dose
    AFTER INSERT OR UPDATE OF proxima_dose ON eventos_sanitarios
    FOR EACH ROW EXECUTE FUNCTION fn_alerta_proxima_dose();


-- ============================================================
--  ENT-12  ALIMENTAÇÕES
-- ============================================================

CREATE TABLE alimentacoes (
    alimentacao_id UUID             DEFAULT gen_random_uuid(),
    animal_id      UUID             NOT NULL,
    data_inicio    DATE             NOT NULL,
    data_fim       DATE,
    tipo           tipo_alimentacao NOT NULL,
    descricao      VARCHAR(255),
    custo_diario   DECIMAL(8, 2),
    observacao     TEXT,
    created_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_alimentacao      PRIMARY KEY (alimentacao_id),
    CONSTRAINT chk_ali_data_fim    CHECK (data_fim IS NULL OR data_fim > data_inicio),
    CONSTRAINT chk_ali_custo       CHECK (custo_diario IS NULL OR custo_diario >= 0),
    CONSTRAINT fk_ali_animal
        FOREIGN KEY (animal_id) REFERENCES animais (animal_id) ON DELETE RESTRICT
);

CREATE INDEX idx_ali_animal_id   ON alimentacoes(animal_id);
CREATE INDEX idx_ali_plano_ativo ON alimentacoes(animal_id) WHERE data_fim IS NULL;


-- ============================================================
--  ENT-13  ANÁLISES IA
-- ============================================================

CREATE TABLE analises_ia (
    analise_id         UUID      DEFAULT gen_random_uuid(),
    animal_id          UUID      NOT NULL,
    tecnico_id         UUID,
    score_prenhez      DECIMAL(5, 4),
    fatores_influentes JSONB,
    parametros_entrada JSONB,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_analise     PRIMARY KEY (analise_id),
    CONSTRAINT chk_analise_score CHECK (score_prenhez IS NULL OR score_prenhez BETWEEN 0 AND 1),
    CONSTRAINT fk_analise_animal
        FOREIGN KEY (animal_id)  REFERENCES animais  (animal_id)  ON DELETE RESTRICT,
    CONSTRAINT fk_analise_tecnico
        FOREIGN KEY (tecnico_id) REFERENCES usuarios (usuario_id) ON DELETE SET NULL
);

CREATE TRIGGER trg_analises_updated_at
    BEFORE UPDATE ON analises_ia
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_analises_animal_id  ON analises_ia(animal_id);
CREATE INDEX idx_analises_tecnico_id ON analises_ia(tecnico_id) WHERE tecnico_id IS NOT NULL;


-- ============================================================
--  FIM
-- ============================================================

COMMIT;
