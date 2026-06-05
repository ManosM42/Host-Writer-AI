import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/site/Sidebar";
import { PackResults, type PackContent } from "@/components/site/PackResults";
import { getPack } from "@/lib/packs.functions";

export const Route = createFileRoute("/_authenticated/packs/$id")({
  head: () => ({ meta: [{ title: "Pack — HostWriter AI" }] }),
  component: PackPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center px-5">
      <p className="text-muted-foreground">Could not load pack: {error.message}</p>
    </div>
  ),
});

function PackPage() {
  const { id } = useParams({ from: "/_authenticated/packs/$id" });
  const { data, isLoading, error } = useQuery({
    queryKey: ["pack", id],
    queryFn: () => getPack(id),
  });

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <AppSidebar />
      <main className="flex-1 px-5 py-8 lg:px-10 lg:py-10">
        <div className="max-w-3xl mx-auto">
          {isLoading && <p className="text-muted-foreground">Loading…</p>}
          {error && <p className="text-destructive">Error: {error.message}</p>}
          {data?.pack && (
            <PackResults
              meta={{
                businessName: data.pack.business_name,
                businessType: data.pack.business_type,
                location: data.pack.location,
                vibe: data.pack.vibe,
              }}
              content={data.pack.content as PackContent}
            />
          )}
          {!isLoading && !data?.pack && !error && <p className="text-muted-foreground">Pack not found</p>}
        </div>
      </main>
    </div>
  );
}