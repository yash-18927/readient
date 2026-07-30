import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout, PlaceholderPanel } from "@/components/dashboard-layout";

export const Route = createFileRoute("/_authenticated/recruiter")({
  beforeLoad: ({ context }) => {
    if (context.profile && context.profile.role !== "recruiter") {
      throw redirect({ to: "/student" });
    }
  },
  head: () => ({
    meta: [
      { title: "Recruiter dashboard — PlacementIQ" },
      { name: "description", content: "Your hiring workspace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RecruiterDashboard,
});

function RecruiterDashboard() {
  const { profile } = Route.useRouteContext();

  return (
    <DashboardLayout
      profile={profile}
      title={`Hi${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
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
