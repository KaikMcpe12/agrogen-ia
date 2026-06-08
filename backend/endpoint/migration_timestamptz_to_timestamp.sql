-- ============================================================================
-- Migração: timestamptz  ->  timestamp (without time zone)
-- ----------------------------------------------------------------------------
-- Objetivo: alinhar o banco Supabase ao documento agroGen_schema.sql, que é a
-- fonte da verdade e declara todas as colunas de hora como TIMESTAMP (naive).
--
-- O backend (models SQLAlchemy + serviços) trata todos os datetimes como
-- naive em UTC. Enquanto as colunas estiverem em `timestamptz`, o asyncpg
-- retorna valores tz-aware e ocorrem erros do tipo:
--   "can't compare offset-naive and offset-aware datetimes"
-- e incompatibilidades timestamp/timestamptz.
--
-- ATENÇÃO ANTES DE RODAR:
--   1. Faça BACKUP do banco (ou rode primeiro em um ambiente de staging).
--   2. Rode o bloco inteiro de uma vez (a sessão precisa estar em UTC).
--   3. Confira o resultado com a query de verificação no final.
-- ============================================================================

-- Garante que a conversão use UTC como referência (evita deslocamento de horas).
SET TIME ZONE 'UTC';

-- Converte dinamicamente TODAS as colunas timestamptz do schema public.
-- `coluna AT TIME ZONE 'UTC'` transforma o instante (armazenado em UTC) no
-- timestamp naive equivalente em UTC — exatamente o que o código Python assume.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND data_type = 'timestamp with time zone'
        ORDER BY table_name, column_name
    LOOP
        RAISE NOTICE 'Convertendo %.% -> timestamp', r.table_name, r.column_name;
        EXECUTE format(
            'ALTER TABLE public.%I ALTER COLUMN %I TYPE timestamp USING %I AT TIME ZONE ''UTC''',
            r.table_name, r.column_name, r.column_name
        );
    END LOOP;
END $$;

-- ============================================================================
-- Verificação — após rodar, o resultado deve mostrar APENAS
-- "timestamp without time zone" para todas as colunas de hora.
-- ============================================================================
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND data_type LIKE 'timestamp%'
-- ORDER BY table_name, column_name;
