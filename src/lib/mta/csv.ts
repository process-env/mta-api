import { promises as fs } from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export interface RouteRecord {
  routeId: string;
  routeName: string;
}

export interface StopRecord {
  stopId: string;
  stopName: string;
  stopLat: number;
  stopLon: number;
  parentStation: string | null;
  routes: string[];
}

interface CsvRouteRow {
  route_id: string;
  route_long_name: string;
}

interface CsvStopRow {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
  parent_station: string;
}

let cachedRoutes: RouteRecord[] | null = null;
let cachedStops: StopRecord[] | null = null;
let cachedStopMap: Map<string, StopRecord> | null = null;
let cachedRouteStopMap: Map<string, StopRecord[]> | null = null;

function dataPath(file: string) {
  return path.join(process.cwd(), "data", file);
}

function inferRoutesForStop(stopId: string): string[] {
  if (!stopId) {
    return [];
  }

  const cleaned = stopId.toUpperCase();
  const firstChar = cleaned[0];

  if (!firstChar) {
    return [];
  }

  if (/^1[0-9A-Z]*/.test(cleaned)) {
    return ["1", "2", "3"];
  }

  if (/^[2-7]/.test(firstChar)) {
    return [firstChar];
  }

  if (firstChar === "S") {
    return ["S"];
  }

  if (firstChar === "R") {
    return ["N", "Q", "R", "W"];
  }

  if (["N", "Q", "W"].includes(firstChar)) {
    return [firstChar];
  }

  return [];
}

export async function getRoutes(): Promise<RouteRecord[]> {
  if (cachedRoutes) {
    return cachedRoutes;
  }

  const file = await fs.readFile(dataPath("routes.txt"), "utf-8");
  const rows = parse(file, { columns: true, skip_empty_lines: true }) as CsvRouteRow[];

  cachedRoutes = rows.map((row) => ({
    routeId: row.route_id,
    routeName: row.route_long_name,
  }));

  return cachedRoutes;
}

export async function getStops(): Promise<StopRecord[]> {
  if (cachedStops) {
    return cachedStops;
  }

  const file = await fs.readFile(dataPath("stops.txt"), "utf-8");
  const rows = parse(file, { columns: true, skip_empty_lines: true }) as CsvStopRow[];

  cachedStops = rows.map((row) => ({
    stopId: row.stop_id,
    stopName: row.stop_name,
    stopLat: Number.parseFloat(row.stop_lat),
    stopLon: Number.parseFloat(row.stop_lon),
    parentStation: row.parent_station ? row.parent_station : null,
    routes: inferRoutesForStop(row.stop_id),
  }));

  return cachedStops;
}

export async function getStopsMap(): Promise<Map<string, StopRecord>> {
  if (cachedStopMap) {
    return cachedStopMap;
  }

  const stops = await getStops();
  cachedStopMap = new Map(stops.map((stop) => [stop.stopId, stop]));
  return cachedStopMap;
}

export async function getStopsForRoute(routeId: string): Promise<StopRecord[]> {
  if (!routeId) {
    return [];
  }

  const normalized = routeId.toUpperCase();

  if (cachedRouteStopMap?.has(normalized)) {
    return cachedRouteStopMap.get(normalized)!;
  }

  if (!cachedRouteStopMap) {
    cachedRouteStopMap = new Map();
  }

  const stops = await getStops();
  const filtered = stops
    .filter((stop) => stop.routes.includes(normalized))
    .sort((a, b) => {
      const nameCompare = a.stopName.localeCompare(b.stopName);
      if (nameCompare !== 0) {
        return nameCompare;
      }
      return a.stopId.localeCompare(b.stopId);
    });

  cachedRouteStopMap.set(normalized, filtered);
  return filtered;
}
