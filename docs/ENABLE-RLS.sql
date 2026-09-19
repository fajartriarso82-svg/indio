-- ==============================================================================
-- Supabase Row Level Security (RLS) Enable Script
-- Mengaktifkan RLS pada seluruh tabel di schema public untuk mengatasi
-- temuan Supabase Security Linter (rls_disabled_in_public & sensitive_columns_exposed).
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public."' || r.tablename || '" ENABLE ROW LEVEL SECURITY;';
        RAISE NOTICE 'RLS Enabled on table: public."%"', r.tablename;
    END LOOP;
END $$;

-- Verifikasi status RLS seluruh tabel di schema public:
SELECT 
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname ASC;
