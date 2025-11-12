"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StationSign } from "@/components/station-sign";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { FEED_GROUPS } from "@/lib/mta/constants";
import type { ApiRoute, ApiStop, ArrivalsApiResponse } from "@/lib/mta/types";

interface SearchResult extends ApiStop {}

type FetchStatus = "idle" | "loading" | "error";

function guessFeedGroup(routes: string[]): string {
  if (routes.some((route) => /^[1-7]$/.test(route))) {
    return "1234567";
  }
  if (routes.some((route) => ["N", "Q", "R", "W"].includes(route))) {
    return "NQRW";
  }
  if (routes.some((route) => ["A", "C", "E"].includes(route))) {
    return "ACE";
  }
  if (routes.some((route) => ["B", "D", "F", "M"].includes(route))) {
    return "BDFM";
  }
  if (routes.includes("G")) return "G";
  if (routes.some((route) => ["J", "Z"].includes(route))) return "JZ";
  if (routes.includes("L")) return "L";
  if (routes.some((route) => route.toUpperCase().startsWith("S"))) return "1234567";
  return "1234567";
}

export function StationSearchCard() {
  const [query, setQuery] = useState("Times Sq");
  const debouncedQuery = useDebounce(query.trim());
  const [routes, setRoutes] = useState<ApiRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchStatus, setSearchStatus] = useState<FetchStatus>("idle");
  const [activeStop, setActiveStop] = useState<ApiStop | null>(null);
  const [arrivals, setArrivals] = useState<ArrivalsApiResponse | null>(null);
  const [arrivalsStatus, setArrivalsStatus] = useState<FetchStatus>("idle");
  const [feedGroup, setFeedGroup] = useState<string>("1234567");
  const [searchVersion, setSearchVersion] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    async function loadRoutes() {
      try {
        const response = await fetch("/api/v1/routes", { cache: "no-store" });
        const data = (await response.json()) as ApiRoute[];
        setRoutes(data);
      } catch (error) {
        console.error(error);
        toast({
          title: "Failed to load routes",
          description: "Using fallback options.",
        });
      }
    }

    loadRoutes();
  }, [toast]);

  useEffect(() => {
    const shouldSearch = debouncedQuery.length > 0;
    if (!shouldSearch) {
      setResults([]);
      setActiveStop(null);
      return;
    }

    async function searchStops() {
      setSearchStatus("loading");
      try {
        const params = new URLSearchParams({ query: debouncedQuery });
        if (selectedRoute) {
          params.set("route", selectedRoute);
        }
        const response = await fetch(`/api/v1/stops?${params.toString()}`, { cache: "no-store" });
        const data = (await response.json()) as SearchResult[];
        setResults(data);
        if (data.length > 0) {
          const stillVisible = activeStop && data.some((stop) => stop.stopId === activeStop.stopId);
          if (!stillVisible) {
            setActiveStop(data[0]);
          }
        }
        setSearchStatus("idle");
      } catch (error) {
        console.error(error);
        setSearchStatus("error");
        toast({
          title: "Search failed",
          description: "Unable to load stops right now.",
        });
      }
    }

    searchStops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, selectedRoute, searchVersion]);

  useEffect(() => {
    if (!activeStop) {
      setArrivals(null);
      return;
    }

    const group = guessFeedGroup(activeStop.routes);
    setFeedGroup(group);
  }, [activeStop]);

  useEffect(() => {
    if (!activeStop || !feedGroup) {
      setArrivals(null);
      return;
    }

    async function loadArrivals() {
      setArrivalsStatus("loading");
      try {
        const response = await fetch(`/api/v1/arrivals/${feedGroup}/${activeStop.stopId}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Request failed");
        }
        const data = (await response.json()) as ArrivalsApiResponse;
        setArrivals(data);
        setArrivalsStatus("idle");
      } catch (error) {
        console.error(error);
        setArrivals(null);
        setArrivalsStatus("error");
        toast({
          title: "Arrivals unavailable",
          description: "Try a different feed group or refresh shortly.",
        });
      }
    }

    loadArrivals();
  }, [activeStop, feedGroup, toast]);

  const activeRoutes = useMemo(() => (activeStop ? activeStop.routes : []), [activeStop]);

  const canSearch = query.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-zinc-800 bg-zinc-900 text-white">
        <CardHeader>
          <CardTitle>Search stations</CardTitle>
          <CardDescription className="text-zinc-400">
            Look up a stop by name or GTFS ID and preview the familiar black-on-white signage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-4 md:grid-cols-[2fr,1fr,auto]"
            onSubmit={(event) => {
              event.preventDefault();
              if (canSearch) {
                setSearchVersion((v) => v + 1);
              }
            }}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Station or ID"
              className="bg-black text-white"
            />
            <Select
              value={selectedRoute || "all"}
              onValueChange={(value) => {
                setSelectedRoute(value === "all" ? "" : value);
              }}
            >
              <SelectTrigger className="bg-black text-white">
                <SelectValue placeholder="All routes" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 text-white">
                <SelectGroup>
                  <SelectItem value="all">All routes</SelectItem>
                  {routes.map((route) => (
                    <SelectItem key={route.routeId} value={route.routeId}>
                      {route.routeId} – {route.routeName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!canSearch} className="bg-blue-500 hover:bg-blue-600">
              Search
            </Button>
          </form>
          <Separator className="bg-zinc-800" />
          <div className="grid gap-4 md:grid-cols-[280px,1fr]">
            <Card className="border-zinc-800 bg-black/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Results</CardTitle>
                <CardDescription className="text-zinc-400">
                  {searchStatus === "loading" ? "Searching…" : `${results.length} stops`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-64 pr-2">
                  <div className="flex flex-col gap-2">
                    {searchStatus === "loading" && results.length === 0 ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-14 w-full bg-zinc-800" />
                      ))
                    ) : (
                      results.map((stop) => (
                        <button
                          key={stop.stopId}
                          type="button"
                          className={`rounded-lg border px-3 py-3 text-left transition ${
                            activeStop?.stopId === stop.stopId
                              ? "border-blue-400 bg-blue-500/10"
                              : "border-transparent bg-zinc-800 hover:bg-zinc-700"
                          }`}
                          onClick={() => setActiveStop(stop)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{stop.stopName}</span>
                            <span className="text-xs text-zinc-400">{stop.stopId}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {stop.routes.map((route) => (
                              <Badge key={route} className="bg-zinc-100 text-black">
                                {route}
                              </Badge>
                            ))}
                          </div>
                        </button>
                      ))
                    )}
                    {results.length === 0 && searchStatus !== "loading" ? (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
                        No stops found. Try a different name or route.
                      </div>
                    ) : null}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card className="border-zinc-800 bg-black/80 p-4">
                {activeStop ? (
                  <StationSign title={`${activeStop.stopName} Station`} routes={activeRoutes} />
                ) : (
                  <div className="flex h-[220px] w-full items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-500">
                    Choose a stop to preview its sign.
                  </div>
                )}
              </Card>
              <Card className="border-zinc-800 bg-black/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Next arrivals</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Live predictions pulled from the selected feed group.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 md:grid-cols-[200px,1fr]">
                    <Select value={feedGroup} onValueChange={setFeedGroup}>
                      <SelectTrigger className="bg-black text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 text-white">
                        <SelectGroup>
                          {FEED_GROUPS.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {arrivals?.isSample ? (
                      <div className="flex items-center justify-end text-sm text-zinc-300">
                        <Badge className="bg-zinc-700 text-white">Sample data</Badge>
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    {arrivalsStatus === "loading" ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <Skeleton key={index} className="h-12 w-full bg-zinc-800" />
                        ))}
                      </div>
                    ) : arrivals && arrivals.arrivals.length > 0 ? (
                      arrivals.arrivals.map((arrival) => (
                        <div
                          key={`${arrival.tripId}-${arrival.stopId}-${arrival.arrivalEpoch}`}
                          className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <Badge className="bg-zinc-100 text-black text-base font-bold">
                              {arrival.routeId}
                            </Badge>
                            <div>
                              <div className="font-semibold text-white">
                                {arrival.headsign ?? "Destination TBD"}
                              </div>
                              <div className="text-xs text-zinc-400">Trip {arrival.tripId}</div>
                            </div>
                          </div>
                          <div className="text-right text-xl font-bold text-white">
                            {arrival.minutes !== null ? `${arrival.minutes} min` : "--"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
                        No arrivals available. Try another feed group.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
