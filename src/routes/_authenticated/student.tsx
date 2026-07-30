import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout, PlaceholderPanel } from "@/components/dashboard-layout";

export const Route = createFileRoute("/_authenticated/student")({
  beforeLoad: ({ context }) => {
    if (context.profile && context.profile.role !== "student") {
      throw redirect({ to: "/recruiter" });
    }
  },
  head: () => ({
    meta: [
      { title: "Student dashboard — PlacementIQ" },
      { name: "description", content: "Your placement readiness workspace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const { profile } = Route.useRouteContext();

  return (
    <DashboardLayout
      profile={profile}
      title={`Hi${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
      subtitle="Your placement readiness workspace."
      navItems={[
        { label: "Overview", active: true },
        { label: "Resume" },
        { label: "Readiness" },
      ]}
    >
      <PlaceholderPanel
        title="Your readiness analysis will appear here"
        body="Resume upload and AI readiness scoring arrive in the next stage."
      />
    </DashboardLayout>
  );
}
