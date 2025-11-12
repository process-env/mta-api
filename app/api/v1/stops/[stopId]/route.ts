import { jsonOk } from "@/lib/mta/http";
import { getStopsMap } from "@/lib/mta/csv";

export async function GET(
  _: Request,
  { params }: { params: { stopId: string } }
) {
  const { stopId } = params;
  if (!stopId) {
    return jsonOk([]);
  }

  const map = await getStopsMap();
  const stop = map.get(stopId.toUpperCase());
  if (!stop) {
    return jsonOk([]);
  }

  return jsonOk(stop);
}
