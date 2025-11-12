import { jsonOk } from "@/lib/mta/http";

export function GET() {
  return jsonOk({ ok: true });
}
