import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout, PlaceholderPanel } from "@/components/dashboard-layout";
import { useProfile, useSession } from "@/lib/auth";

export const Route = createFileRoute("/recruiter")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Recruiter workspace — PlacementIQ" },
      { name: "description", content: "Post roles and rank candidates with AI." },
      { property: "og:title", content: "Recruiter workspace — PlacementIQ" },
      { property: "og:description", content: "Post roles and rank candidates with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RecruiterDashboard,
});

function RecruiterDashboard() {
  const navigate = useNavigate();
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);

  useEffect(() => {
    if (profile && profile.role === "student") navigate({ to: "/student", replace: true });
  }, [profile, navigate]);

  return (
    <DashboardLayout
      profile={profile ?? null}
      signedIn={Boolean(session)}
      role="recruiter"
      title={
        session && profile?.full_name
          ? `Hi, ${profile.full_name.split(" ")[0]}`
          : "Recruiter workspace"
      }
      subtitle="Your hiring workspace."
      navItems={[
        { label: "Overview", active: true },
        { label: "Job postings" },
        { label: "Candidates" },
      ]}
    >
      <PlaceholderPanel
        title="Your job listings will appear here"
        body="AI job posting and candidate ranking arrive in the next stage."
      />
    </DashboardLayout>
  );
}
