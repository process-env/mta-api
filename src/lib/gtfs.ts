import { promises as fs } from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';

const DATA_DIR = path.join(process.cwd(), 'data');
const ROUTES_CSV = path.join(DATA_DIR, 'routes.txt');
const STOPS_CSV = path.join(DATA_DIR, 'stops.txt');

export interface RouteRecord {
  id: string;
  shortName: string;
  longName: string;
  desc: string | null;
  type: string;
  color: string | null;
  textColor: string | null;
}

export interface StopRecord {
  id: string;
  name: string;
  lat: number;
  lon: number;
  routes: string | null;
  parent: string | null;
  locationType: number | null;
}

export interface RouteSummary {
  id: string;
  shortName: string;
  label: string;
  color: string | null;
  textColor: string | null;
}

let routesCache: { list: RouteRecord[]; dict: Record<string, RouteRecord> } | null = null;
let stopsCache: { dict: Record<string, StopRecord> } | null = null;

function readHexColor(color: string | null | undefined): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

export async function loadRoutes(): Promise<{ list: RouteRecord[]; dict: Record<string, RouteRecord> }> {
  if (routesCache) return routesCache;
  const text = await fs.readFile(ROUTES_CSV, 'utf8');
  const rows = csvParse(text, { columns: true, skip_empty_lines: true, trim: true });
  const list: RouteRecord[] = rows.map((row: Record<string, string>) => ({
    id: row.route_id,
    shortName: row.route_short_name || row.route_id,
    longName: row.route_long_name || row.route_short_name || row.route_id,
    desc: row.route_desc || null,
    type: row.route_type,
    color: readHexColor(row.route_color),
    textColor: readHexColor(row.route_text_color),
  }));
  const dict = Object.fromEntries(list.map(route => [route.id, route]));
  routesCache = { list, dict };
  return routesCache;
}

export async function loadStops(): Promise<{ dict: Record<string, StopRecord> }> {
  if (stopsCache) return stopsCache;
  const text = await fs.readFile(STOPS_CSV, 'utf8');
  const rows = csvParse(text, { columns: true, skip_empty_lines: true, trim: true });
  const dict: Record<string, StopRecord> = {};
  for (const row of rows as Array<Record<string, string>>) {
    const locationType = row.location_type ? Number(row.location_type) : null;
    dict[row.stop_id] = {
      id: row.stop_id,
      name: row.stop_name,
      lat: Number(row.stop_lat),
      lon: Number(row.stop_lon),
      routes: row.routes || null,
      parent: row.parent_station || null,
      locationType,
    };
  }
  stopsCache = { dict };
  return stopsCache;
}

export async function listRouteSummaries(): Promise<RouteSummary[]> {
  const { list } = await loadRoutes();
  return list
    .map(route => ({
      id: route.id,
      shortName: route.shortName,
      label: route.shortName === route.longName ? route.shortName : `${route.shortName} — ${route.longName}`,
      color: route.color,
      textColor: route.textColor,
    }))
    .sort((a, b) => a.shortName.localeCompare(b.shortName, undefined, { numeric: true, sensitivity: 'base' }));
}
