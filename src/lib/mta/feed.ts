import { promises as fs } from "fs";
import path from "path";
import { load, Root } from "protobufjs";
import { getEnv } from "@/lib/env";
import { FEED_GROUPS, FEED_PATHS, type FeedGroupId } from "./constants";

export interface StopTimeUpdate {
  stopId: string;
  arrivalEpoch: number | null;
  headsign?: string | null;
}

export interface TripUpdate {
  tripId: string;
  routeId: string;
  stopTimeUpdates: StopTimeUpdate[];
}

export interface FeedResult {
  groupId: FeedGroupId;
  trips: TripUpdate[];
  timestamp: number;
  isSample: boolean;
}

interface CacheEntry {
  expiresAt: number;
  value: FeedResult;
}

const cache = new Map<FeedGroupId, CacheEntry>();
let protoRoot: Root | null = null;

async function loadProto() {
  if (!protoRoot) {
    protoRoot = await load(path.join(process.cwd(), "data", "gtfs-realtime.proto"));
  }
  return protoRoot;
}

async function readSample(): Promise<FeedResult> {
  const file = await fs.readFile(path.join(process.cwd(), "data", "sampleFeed.json"), "utf-8");
  const parsed = JSON.parse(file) as Omit<FeedResult, "groupId"> & { groupId?: FeedGroupId };
  return {
    groupId: (parsed.groupId ?? "1234567") as FeedGroupId,
    trips: parsed.trips,
    timestamp: parsed.timestamp ?? Math.floor(Date.now() / 1000),
    isSample: true,
  };
}

function normalizeGroup(groupId: string): FeedGroupId {
  const upper = groupId.toUpperCase();
  if (FEED_GROUPS.includes(upper as FeedGroupId)) {
    return upper as FeedGroupId;
  }
  throw new Error(`Unknown feed group: ${groupId}`);
}

function decodeFeed(buffer: ArrayBuffer): TripUpdate[] {
  const root = protoRoot;
  if (!root) {
    throw new Error("Proto root not loaded");
  }
  const FeedMessage = root.lookupType("transit_realtime.FeedMessage");
  const message = FeedMessage.decode(new Uint8Array(buffer));
  const object = FeedMessage.toObject(message, {
    longs: Number,
    enums: String,
    defaults: false,
  }) as {
    entity?: Array<{
      id?: string;
      tripUpdate?: {
        trip?: { tripId?: string; routeId?: string };
        stopTimeUpdate?: Array<{
          stopId?: string;
          arrival?: { time?: number };
          departure?: { time?: number };
          stopHeadsign?: string;
        }>;
      };
    }>;
  };

  const trips: TripUpdate[] = [];

  for (const entity of object.entity ?? []) {
    if (!entity.tripUpdate) continue;
    const tripId = entity.tripUpdate.trip?.tripId ?? "";
    const routeId = entity.tripUpdate.trip?.routeId ?? "";
    if (!tripId || !routeId) continue;
    const stopTimeUpdates: StopTimeUpdate[] = [];

    for (const update of entity.tripUpdate.stopTimeUpdate ?? []) {
      const arrival = update.arrival?.time ?? update.departure?.time ?? null;
      const stopId = update.stopId ?? "";
      if (!stopId) continue;
      stopTimeUpdates.push({
        stopId,
        arrivalEpoch: arrival,
        headsign: update.stopHeadsign ?? null,
      });
    }

    if (stopTimeUpdates.length > 0) {
      trips.push({ tripId, routeId, stopTimeUpdates });
    }
  }

  return trips;
}

export async function fetchFeed(groupId: string): Promise<FeedResult> {
  const env = getEnv();
  let normalized: FeedGroupId;
  try {
    normalized = normalizeGroup(groupId);
  } catch (error) {
    throw error;
  }

  const now = Date.now();
  const cached = cache.get(normalized);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const ttl = env.CACHE_TTL_MS;
  const expiresAt = now + ttl;

  const requestUrl = new URL(FEED_PATHS[normalized], env.FEED_BASE_URL);
  let trips: TripUpdate[] | null = null;
  let isSample = false;
  let timestamp = Math.floor(Date.now() / 1000);

  try {
    await loadProto();
    const response = await fetch(requestUrl.toString(), {
      headers: env.MTA_API_KEY ? { "x-api-key": env.MTA_API_KEY } : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Feed response ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    trips = decodeFeed(buffer);
    timestamp = Math.floor(Date.now() / 1000);
  } catch (error) {
    console.warn("Falling back to sample feed", error);
    const sample = await readSample();
    trips = sample.trips;
    timestamp = sample.timestamp;
    isSample = true;
  }

  const result: FeedResult = {
    groupId: normalized,
    trips: trips ?? [],
    timestamp,
    isSample,
  };

  cache.set(normalized, { value: result, expiresAt });
  return result;
}
