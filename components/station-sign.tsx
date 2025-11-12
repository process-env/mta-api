"use client";

import { useMemo } from "react";
import ReactFlow, { Background, BackgroundVariant } from "reactflow";
import "reactflow/dist/style.css";

import { createSignNodes } from "@/components/sign/sign-layout";
import { RouteBulletNode } from "@/components/nodes/route-bullet-node";
import { StationPlaqueNode } from "@/components/nodes/station-plaque-node";
import { ROUTE_COLORS } from "@/lib/mta/constants";

const nodeTypes = {
  routeBullet: RouteBulletNode,
  stationPlaque: StationPlaqueNode,
};

export interface StationSignProps {
  title: string;
  routes: string[];
}

const fallbackColor = "#222";

export function StationSign({ title, routes }: StationSignProps) {
  const nodes = useMemo(
    () =>
      createSignNodes(title, routes, (route) => ROUTE_COLORS[route] ?? fallbackColor),
    [title, routes]
  );

  return (
    <div className="h-[220px] w-full overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900">
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        panOnScroll={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#2f2f2f" />
      </ReactFlow>
    </div>
  );
}
