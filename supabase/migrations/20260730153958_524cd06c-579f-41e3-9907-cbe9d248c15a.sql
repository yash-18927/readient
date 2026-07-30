-- Public, slug-scoped read of a job posting (bypasses the recruiter-only SELECT policy).
CREATE OR REPLACE FUNCTION public.public_job_by_slug(_slug text)
RETURNS TABLE (
  id uuid,
  title text,
  company text,
  structured_requirements jsonb,
  rubric jsonb,
  status text,
  deadline timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT j.id, j.title, j.company, j.structured_requirements, j.rubric, j.status, j.deadline
  FROM public.jobs j
  WHERE j.share_slug = _slug
$$;

REVOKE ALL ON FUNCTION public.public_job_by_slug(text) FROM public;
GRANT EXECUTE ON FUNCTION public.public_job_by_slug(text) TO anon, authenticated, service_role;

-- Is a job still accepting submissions?
CREATE OR REPLACE FUNCTION public.job_is_open(_job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = _job_id
      AND j.status = 'open'
      AND (j.deadline IS NULL OR j.deadline > now())
  )
$$;

REVOKE ALL ON FUNCTION public.job_is_open(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.job_is_open(uuid) TO anon, authenticated, service_role;

-- Anyone holding a valid share link may apply to an open job; nobody but the
-- owning recruiter can read submissions back.
GRANT INSERT ON public.submissions TO anon;

CREATE POLICY "Anyone can apply to an open job"
ON public.submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (public.job_is_open(job_id));