CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL,
  title text NOT NULL,
  company text NOT NULL DEFAULT '',
  raw_input text NOT NULL DEFAULT '',
  structured_requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  rubric jsonb NOT NULL DEFAULT '{}'::jsonb,
  share_slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'open',
  deadline timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view their own jobs" ON public.jobs
  FOR SELECT TO authenticated USING (auth.uid() = recruiter_id);
CREATE POLICY "Recruiters can create their own jobs" ON public.jobs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = recruiter_id);
CREATE POLICY "Recruiters can update their own jobs" ON public.jobs
  FOR UPDATE TO authenticated USING (auth.uid() = recruiter_id) WITH CHECK (auth.uid() = recruiter_id);
CREATE POLICY "Recruiters can delete their own jobs" ON public.jobs
  FOR DELETE TO authenticated USING (auth.uid() = recruiter_id);

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX jobs_recruiter_id_idx ON public.jobs (recruiter_id);
CREATE INDEX jobs_share_slug_idx ON public.jobs (share_slug);

CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_name text,
  candidate_email text,
  links jsonb NOT NULL DEFAULT '{}'::jsonb,
  resume_text text NOT NULL,
  resume_file_name text,
  analysis_result jsonb NOT NULL,
  score integer NOT NULL DEFAULT 0,
  submitted_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view submissions to their jobs" ON public.submissions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = submissions.job_id AND j.recruiter_id = auth.uid())
  );

CREATE INDEX submissions_job_id_idx ON public.submissions (job_id);