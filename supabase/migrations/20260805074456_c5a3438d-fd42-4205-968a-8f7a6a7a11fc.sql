CREATE OR REPLACE FUNCTION public.public_job_rank(_slug text, _score integer)
RETURNS TABLE(rank integer, total integer, top_name text, top_score integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH j AS (SELECT id FROM public.jobs WHERE share_slug = _slug),
  s AS (SELECT candidate_name, score FROM public.submissions WHERE job_id = (SELECT id FROM j))
  SELECT
    (SELECT count(*)::int FROM s WHERE s.score > _score) + 1,
    (SELECT count(*)::int FROM s),
    (SELECT COALESCE(NULLIF(btrim(s.candidate_name), ''), 'Anonymous') FROM s ORDER BY s.score DESC, s.candidate_name NULLS LAST LIMIT 1),
    (SELECT s.score FROM s ORDER BY s.score DESC LIMIT 1)
  WHERE EXISTS (SELECT 1 FROM j)
$$;

GRANT EXECUTE ON FUNCTION public.public_job_rank(text, integer) TO anon, authenticated;