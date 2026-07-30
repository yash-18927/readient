-- Lock down search_path and minimise EXECUTE grants on the two SECURITY DEFINER helpers.
ALTER FUNCTION public.public_job_by_slug(text) SET search_path = public;
ALTER FUNCTION public.job_is_open(uuid) SET search_path = public;

REVOKE ALL ON FUNCTION public.public_job_by_slug(text) FROM PUBLIC, authenticated;
REVOKE ALL ON FUNCTION public.job_is_open(uuid) FROM PUBLIC;

-- Public candidate flow runs with the publishable (anon) key only.
GRANT EXECUTE ON FUNCTION public.public_job_by_slug(text) TO anon, service_role;
-- Required by the submissions INSERT policy (with_check job_is_open(job_id)),
-- which is evaluated as the calling role for both anon and signed-in applicants.
GRANT EXECUTE ON FUNCTION public.job_is_open(uuid) TO anon, authenticated, service_role;