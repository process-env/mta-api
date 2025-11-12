import { FEED_GROUPS } from "@/lib/mta/constants";
import { jsonOk } from "@/lib/mta/http";

export async function GET() {
  return jsonOk(FEED_GROUPS);
}
