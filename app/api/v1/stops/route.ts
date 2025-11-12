import { NextRequest } from "next/server";

import { getStops } from "@/lib/mta/csv";
import { jsonError, jsonOk } from "@/lib/mta/http";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const route = searchParams.get("route");

  if (!query) {
    return jsonError("query param required", 400);
  }

  const stops = await getStops();
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = stops.filter((stop) => {
    const matchesQuery =
      stop.stopId.toLowerCase().includes(normalizedQuery) ||
      stop.stopName.toLowerCase().includes(normalizedQuery);
    const matchesRoute = route ? stop.routes.includes(route.toUpperCase()) : true;
    return matchesQuery && matchesRoute;
  });

  return jsonOk(filtered);
}
