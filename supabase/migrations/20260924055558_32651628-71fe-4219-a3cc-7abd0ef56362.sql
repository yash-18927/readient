CREATE OR REPLACE FUNCTION public.public_job_rubric(_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT j.rubric FROM public.jobs j WHERE j.share_slug = _slug
$$;

REVOKE ALL ON FUNCTION public.public_job_rubric(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_job_rubric(text) FROM anon;
REVOKE ALL ON FUNCTION public.public_job_rubric(text) FROM authenticated;