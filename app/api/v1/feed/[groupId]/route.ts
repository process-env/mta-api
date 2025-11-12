import { fetchFeed } from "@/lib/mta/feed";
import { jsonError, jsonOk } from "@/lib/mta/http";

export async function GET(
  _: Request,
  { params }: { params: { groupId: string } }
) {
  const { groupId } = params;
  if (!groupId) {
    return jsonError("groupId required", 400);
  }

  try {
    const feed = await fetchFeed(groupId);
    return jsonOk(feed);
  } catch (error) {
    return jsonError((error as Error).message, 400);
  }
}
