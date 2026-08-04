# Hardening pass: job links, evidence inputs, LinkedIn CSV, stability

Working the hardening items first (6-11). Visual items (hero visual options, rain/stars overlay, micro-animations, pull-to-refresh, transition bug) stay queued and come after.

## Order of work

1. Job-link submission reliability (items 6, 10)
2. LinkedIn CSV upload box (item 7)
3. Evidence field verification — LeetCode / HackerRank / Kaggle and non-CS fields (items 8, 9)
4. Stability / smoothness pass (item 11)

## 1. Job-link flow — reliability

The public apply flow does: extract resume text -> score against the job -> insert the submission. Scoring calls the Lovable AI gateway first and falls back to an OpenRouter free model. Two things make this fail the way you saw:

- Both providers can fail on rate limit / quota and the user only gets one generic "both providers failed" message, with no retry.
- Long analyses run with no progress signal, so a slow or failed run looks like nothing happened.

Changes:
- Distinguish rate-limit (429) and quota (402) responses from real errors, retry the primary once with a short backoff before falling back, and surface a clear message per case ("busy, retry in a moment" vs "could not read your resume").
- Add a "Try again" action on the apply page failure state that re-runs scoring without re-uploading the file.
- Guard against double-submits (disable while in-flight) and keep the resume text in state so a retry is instant.
- Cache public submissions the same way authenticated analyses are cached, so an identical retry does not burn another AI call.
- End-to-end verification of the share link: create a job as recruiter, open the slug in a clean browser session, submit a resume, confirm the submission lands and appears in the recruiter leaderboard; also check the closed-job and past-deadline states.

## 2. LinkedIn CSV upload

Add a second drop box next to the existing resume drop box, labelled for the LinkedIn data export. It accepts the CSV files from LinkedIn's export (or the export ZIP), parses them in the browser, and feeds the extracted text into the analysis alongside the resume. The existing "LinkedIn URL" text field is replaced by this upload wherever LinkedIn evidence is collected (student analysis form and the public apply form). No layout change beyond the added drop box, matching the existing dashed dropzone style.

## 3. Evidence field verification

Confirm LeetCode / HackerRank / Kaggle and the non-CS academic/professional evidence fields actually flow through: form -> server function -> prompt -> result. Fix any field that is collected but not reaching the prompt, or listed for a field-of-study but not rendered.

## 4. Stability pass

- Audit route transitions and loader waterfalls that make navigation feel sluggish, and add pending states where a route currently blanks.
- Check the console and network for repeated or duplicated requests on the dashboard and results pages.
- Confirm no unhandled promise rejections during analysis.

## Technical notes

- Touched: `src/lib/analysis/ai.server.ts` (retry/error classification), `src/lib/public-jobs.functions.ts` (caching, clearer errors), `src/routes/apply.$slug.tsx` (retry action, in-flight guard), `src/lib/analysis/fields.ts` and the resume/apply forms (LinkedIn CSV), prompt builders.
- No schema changes expected except an optional cache table reuse for public submissions.
- No functionality, route, or copy changes beyond what is listed.
