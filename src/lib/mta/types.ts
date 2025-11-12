export interface ApiRoute {
  routeId: string;
  routeName: string;
}

export interface ApiStop {
  stopId: string;
  stopName: string;
  stopLat: number;
  stopLon: number;
  parentStation: string | null;
  routes: string[];
}

export interface ArrivalsApiResponse {
  stopId: string;
  groupId: string;
  generatedAt: string;
  isSample: boolean;
  arrivals: Array<{
    tripId: string;
    routeId: string;
    stopId: string;
    headsign: string | null;
    arrivalEpoch: number | null;
    minutes: number | null;
  }>;
}
