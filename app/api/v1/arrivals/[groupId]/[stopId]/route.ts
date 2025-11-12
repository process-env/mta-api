import { getArrivals } from "@/lib/mta/arrivals";
import { jsonError, jsonOk } from "@/lib/mta/http";

export async function GET(
  _: Request,
  { params }: { params: { groupId: string; stopId: string } }
) {
  const { groupId, stopId } = params;
  if (!groupId || !stopId) {
    return jsonError("groupId and stopId required", 400);
  }

  try {
    const arrivals = await getArrivals(groupId, stopId);
    return jsonOk(arrivals);
  } catch (error) {
    return jsonError((error as Error).message, 400);
  }
}
