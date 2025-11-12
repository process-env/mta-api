import { getStopsForRoute } from "@/lib/mta/csv";
import { jsonError, jsonOk } from "@/lib/mta/http";

export async function GET(
  _: Request,
  { params }: { params: { segments?: string[] } }
) {
  const segments = params.segments ?? [];
  if (segments.length === 0) {
    return jsonError("Route path missing", 400);
  }

  const normalizedSegments = segments.filter((segment) => segment.length > 0);
  const stopsIndex = normalizedSegments.findIndex((segment) => segment.toLowerCase() === "stops");
  if (stopsIndex === -1) {
    return jsonError("Unsupported route path", 400);
  }

  let routeId: string | undefined;
  if (normalizedSegments.length > stopsIndex + 1) {
    routeId = normalizedSegments[normalizedSegments.length - 1];
  } else if (stopsIndex > 0) {
    routeId = normalizedSegments[stopsIndex - 1];
  }

  if (!routeId) {
    return jsonError("Route ID required", 400);
  }

  const stops = await getStopsForRoute(routeId);
  return jsonOk(stops);
}
