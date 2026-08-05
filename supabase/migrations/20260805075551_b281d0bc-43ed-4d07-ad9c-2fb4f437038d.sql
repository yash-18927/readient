create or replace function public.public_job_standings(_slug text)
returns table(rank integer, name text, score integer)
language sql
stable
security definer
set search_path to 'public'
as $$
  with j as (select id from public.jobs where share_slug = _slug)
  select
    (row_number() over (order by s.score desc, s.submitted_at asc))::int as rank,
    coalesce(nullif(btrim(s.candidate_name), ''), 'Anonymous') as name,
    s.score
  from public.submissions s
  where s.job_id = (select id from j)
  order by s.score desc, s.submitted_at asc
$$;

grant execute on function public.public_job_standings(text) to anon, authenticated, service_role;