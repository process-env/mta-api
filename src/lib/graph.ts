import type { Edge, Node } from 'reactflow';
import { listRouteSummaries, loadRoutes, loadStops, type StopRecord } from './gtfs';
import { filterStopsByRoute } from './routeMatching';

export interface RouteNodeData {
  label: string;
  stopId: string;
  latitude: number;
  longitude: number;
}

export type RouteNode = Node<RouteNodeData>;
export type RouteEdge = Edge;

export interface RouteGraphData {
  routeId: string;
  routeLabel: string;
  color: string;
  textColor: string;
  nodes: RouteNode[];
  edges: RouteEdge[];
  stopCount: number;
  updatedAt: string;
}

function ensureColor(hex: string | null | undefined, fallback: string): string {
  if (!hex) return fallback;
  return hex.startsWith('#') ? hex : `#${hex}`;
}

function stationIdForStop(stop: StopRecord): string {
  return stop.parent || stop.id;
}

function createStationCatalog(stops: Record<string, StopRecord>): Map<string, StopRecord> {
  const catalog = new Map<string, StopRecord>();
  for (const stop of Object.values(stops)) {
    if (stop.locationType === 1 || !stop.parent) {
      catalog.set(stop.id, stop);
    }
  }
  return catalog;
}

function dedupeStations(
  candidateStops: StopRecord[],
  stationCatalog: Map<string, StopRecord>,
): Array<{ id: string; name: string; lat: number; lon: number }> {
  const map = new Map<string, { id: string; name: string; lat: number; lon: number }>();
  for (const stop of candidateStops) {
    const stationId = stationIdForStop(stop);
    if (map.has(stationId)) continue;
    const station = stationCatalog.get(stationId) ?? stop;
    map.set(stationId, {
      id: stationId,
      name: station.name,
      lat: station.lat,
      lon: station.lon,
    });
  }
  return Array.from(map.values());
}

function buildFallbackStops(allStops: Record<string, StopRecord>): StopRecord[] {
  const stops = Object.values(allStops);
  const uniqueByStation = new Map<string, StopRecord>();
  for (const stop of stops) {
    const stationId = stationIdForStop(stop);
    if (!uniqueByStation.has(stationId)) {
      uniqueByStation.set(stationId, stop);
    }
  }
  return Array.from(uniqueByStation.values())
    .sort((a, b) => b.lat - a.lat || a.lon - b.lon)
    .slice(0, 24);
}

function createLayoutNodes(
  stations: Array<{ id: string; name: string; lat: number; lon: number }>,
  color: string,
  textColor: string,
): RouteNode[] {
  return stations.map((station, index) => {
    const angle = (index / Math.max(stations.length - 1, 1)) * Math.PI;
    const radius = 180;
    const x = Math.cos(angle) * radius * index;
    const y = Math.sin(angle) * radius * 0.6;

    return {
      id: station.id,
      position: { x, y },
      data: {
        label: station.name,
        stopId: station.id,
        latitude: station.lat,
        longitude: station.lon,
      },
      draggable: false,
      style: {
        padding: '0.75rem 1.05rem',
        borderRadius: '9999px',
        border: `2px solid ${color}`,
        background: 'rgba(15, 23, 42, 0.92)',
        color: textColor,
        fontWeight: 600,
        letterSpacing: '0.01em',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.45)',
        minWidth: '140px',
        textAlign: 'center',
      },
    } satisfies RouteNode;
  });
}

function createLayoutEdges(nodes: RouteNode[], color: string): RouteEdge[] {
  const edges: RouteEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    edges.push({
      id: `${nodes[i]!.id}-${nodes[i + 1]!.id}`,
      source: nodes[i]!.id,
      target: nodes[i + 1]!.id,
      animated: true,
      style: {
        stroke: color,
        strokeWidth: 2.4,
      },
    });
  }
  return edges;
}

export async function buildRouteGraph(routeId: string): Promise<RouteGraphData> {
  const upperId = routeId.toUpperCase();
  const [{ dict: routeDict }, { dict: stopsDict }] = await Promise.all([loadRoutes(), loadStops()]);
  const route = routeDict[upperId] ?? routeDict[routeId] ?? null;

  const stationCatalog = createStationCatalog(stopsDict);
  const targetStops = filterStopsByRoute(Object.values(stopsDict), upperId);
  const candidateStops = targetStops.length > 0 ? targetStops : buildFallbackStops(stopsDict);
  const stations = dedupeStations(candidateStops, stationCatalog);

  stations.sort((a, b) => b.lat - a.lat || a.lon - b.lon);

  const color = ensureColor(route?.color, '#38bdf8');
  const textColor = ensureColor(route?.textColor, '#f8fafc');
  const nodes = createLayoutNodes(stations, color, textColor);
  const edges = createLayoutEdges(nodes, color);

  const shortName = route?.shortName ?? upperId;
  const label = route?.longName && route.longName !== shortName ? `${shortName} — ${route.longName}` : shortName;

  return {
    routeId: upperId,
    routeLabel: label,
    color,
    textColor,
    nodes,
    edges,
    stopCount: stations.length,
    updatedAt: new Date().toISOString(),
  };
}

export async function listRoutesForClient() {
  return listRouteSummaries();
}
