import RouteFlowClient from '@/components/RouteFlowClient';
import { buildRouteGraph, listRoutesForClient } from '@/lib/graph';

export default async function HomePage() {
  const routes = await listRoutesForClient();
  const fallbackRoute = routes[0] ?? {
    id: '1',
    shortName: '1',
    label: '1 — Broadway Local',
    color: '#38bdf8',
    textColor: '#f8fafc',
  };
  const initialGraph = await buildRouteGraph(fallbackRoute.id);

  return (
    <main>
      <h1>MTA React Flow Explorer</h1>
      <p className="lede">
        Dive into a stylised view of New York City subway lines powered by Next.js 15 Canary and
        React Flow. Choose a line to see its stations arranged in a dynamic network layout that you
        can pan and zoom.
      </p>
      <RouteFlowClient initialGraph={initialGraph} routes={routes} />
    </main>
  );
}
