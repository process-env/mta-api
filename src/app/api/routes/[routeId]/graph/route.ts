import { buildRouteGraph } from '@/lib/graph';

export async function GET(
  _request: Request,
  context: { params: { routeId: string } },
) {
  const routeId = context.params.routeId;
  if (!routeId) {
    return new Response(JSON.stringify({ error: 'Missing route id' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const graph = await buildRouteGraph(routeId);
    return new Response(JSON.stringify(graph), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to build route graph', error);
    return new Response(JSON.stringify({ error: 'Unable to build route graph' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
