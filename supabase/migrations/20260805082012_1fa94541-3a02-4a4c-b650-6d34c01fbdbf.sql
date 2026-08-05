-- Narrow the anon-callable public job lookup so it can never return `rubric`.
-- Return type changes, so the old function must be dropped first.
DROP FUNCTION IF EXISTS public.public_job_by_slug(text);

CREATE OR REPLACE FUNCTION public.public_job_by_slug(_slug text)
RETURNS TABLE(
  id uuid,
  title text,
  company text,
  structured_requirements jsonb,
  status text,
  deadline timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT j.id, j.title, j.company, j.structured_requirements, j.status, j.deadline
  FROM public.jobs j
  WHERE j.share_slug = _slug
$function$;

REVOKE ALL ON FUNCTION public.public_job_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_job_by_slug(text) TO anon, authenticated, service_role;