import { getRoutes } from "@/lib/mta/csv";
import { jsonOk } from "@/lib/mta/http";

export async function GET() {
  const routes = await getRoutes();
  return jsonOk(routes);
}
