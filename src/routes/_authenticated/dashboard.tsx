import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/site/Sidebar";
import { Dashboard } from "@/components/site/Dashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MedierAI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <AppSidebar />
      <main className="flex-1 px-5 py-8 lg:px-10 lg:py-10">
        <div className="max-w-5xl mx-auto">
          <Dashboard />
        </div>
      </main>
    </div>
  );
}