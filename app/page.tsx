import { Suspense } from "react";
import { StationSearchCard } from "@/components/station-search";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">MTA Express Explorer</h1>
      <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
        <StationSearchCard />
      </Suspense>
    </main>
  );
}
