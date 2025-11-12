import { fetchFeed } from "./feed";

export interface Arrival {
  tripId: string;
  routeId: string;
  stopId: string;
  headsign: string | null;
  arrivalEpoch: number | null;
  minutes: number | null;
}

export interface ArrivalsResponse {
  stopId: string;
  groupId: string;
  generatedAt: string;
  arrivals: Arrival[];
  isSample: boolean;
}

export async function getArrivals(groupId: string, stopId: string): Promise<ArrivalsResponse> {
  const normalizedStop = stopId.toUpperCase();
  const feed = await fetchFeed(groupId);
  const now = Date.now();

  const arrivals = feed.trips
    .flatMap((trip) =>
      trip.stopTimeUpdates
        .filter((update) => update.stopId?.toUpperCase() === normalizedStop)
        .map((update) => {
          const minutes = update.arrivalEpoch
            ? Math.max(0, Math.round((update.arrivalEpoch * 1000 - now) / 60000))
            : null;
          return {
            tripId: trip.tripId,
            routeId: trip.routeId,
            stopId: update.stopId,
            headsign: update.headsign ?? null,
            arrivalEpoch: update.arrivalEpoch,
            minutes,
          };
        })
    )
    .filter((arrival) => arrival.arrivalEpoch !== null)
    .sort((a, b) => (a.arrivalEpoch! - b.arrivalEpoch!))
    .slice(0, 5);

  return {
    stopId: normalizedStop,
    groupId: feed.groupId,
    generatedAt: new Date(feed.timestamp * 1000).toISOString(),
    arrivals,
    isSample: feed.isSample,
  };
}
