-- FIX: Conceder permissões explícitas para a sequência e tabela
-- Permite que usuários autenticados usem o contador automático (report_number)

GRANT USAGE, SELECT ON SEQUENCE public.bdp_report_seq TO authenticated;
GRANT ALL ON TABLE public.bdp_reports TO authenticated;
GRANT ALL ON TABLE public.bdp_reports TO service_role;

-- Verifica se a sequence está sincronizada (Opcional, mas útil)
SELECT setval('bdp_report_seq', COALESCE((SELECT MAX(report_number) FROM bdp_reports), 0) + 1, false);
