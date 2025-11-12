'use client';

import { type ChangeEvent, useMemo, useState, useTransition } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import type { RouteGraphData, RouteNodeData } from '@/lib/graph';
import type { RouteSummary } from '@/lib/gtfs';

interface RouteFlowClientProps {
  initialGraph: RouteGraphData;
  routes: RouteSummary[];
}

async function requestGraph(routeId: string): Promise<RouteGraphData> {
  const response = await fetch(`/api/routes/${encodeURIComponent(routeId)}/graph`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Failed to load graph for ${routeId}`);
  }
  return response.json();
}

function withOpacity(color: string, alpha: number): string {
  const normalized = color.startsWith('#') ? color.slice(1) : color;
  if (normalized.length === 3) {
    const [r, g, b] = normalized.split('');
    return `rgba(${parseInt(`${r}${r}`, 16)}, ${parseInt(`${g}${g}`, 16)}, ${parseInt(`${b}${b}`, 16)}, ${alpha})`;
  }
  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(56, 189, 248, ${alpha})`;
}

export default function RouteFlowClient({ initialGraph, routes }: RouteFlowClientProps) {
  const [graph, setGraph] = useState<RouteGraphData>(initialGraph);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentRoute = useMemo(
    () => routes.find(route => route.id === graph.routeId) ?? routes[0],
    [graph.routeId, routes],
  );

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextRouteId = event.target.value;
    startTransition(() => {
      requestGraph(nextRouteId)
        .then(data => {
          setGraph(data);
          setError(null);
        })
        .catch(err => {
          console.error(err);
          setError('We couldn\'t load that route. Please try another selection.');
        });
    });
  };

  return (
    <section className="section-card">
      <div className="route-picker">
        <label htmlFor="route">Choose a subway line</label>
        <select
          id="route"
          className="route-select"
          value={graph.routeId}
          onChange={handleChange}
          disabled={isPending}
        >
          {routes.map(route => (
            <option key={route.id} value={route.id}>
              {route.label}
            </option>
          ))}
        </select>
        <span className={`feedback${error ? ' error' : ''}`}>
          {error
            ? error
            : isPending
              ? 'Loading route graph…'
              : `Rendering ${graph.stopCount} stops`}
        </span>
      </div>

      <div className="canvas-shell">
        <ReactFlow<RouteNodeData>
          nodes={graph.nodes}
          edges={graph.edges}
          fitView
          fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.75 }}
          nodesConnectable={false}
          nodesDraggable={false}
          panOnScroll
          panOnDrag
          zoomOnPinch
          zoomOnScroll
          proOptions={{ hideAttribution: true }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
        >
          <Background
            id="grid"
            gap={32}
            size={2}
            color="rgba(148, 163, 184, 0.25)"
          />
          <MiniMap
            pannable
            zoomable
            nodeStrokeColor={() => graph.color}
            nodeColor={() => withOpacity(graph.color, 0.2)}
            maskColor={withOpacity('#020617', 0.75)}
          />
          <Controls
            showInteractive={false}
            style={{ background: 'rgba(15, 23, 42, 0.85)', borderRadius: '9999px' }}
          />
        </ReactFlow>
      </div>

      <footer>
        {currentRoute ? (
          <span>
            {currentRoute.label} · Powered by Next.js 15 Canary + React Flow · Updated{' '}
            {new Intl.DateTimeFormat('en', {
              hour: 'numeric',
              minute: 'numeric',
            }).format(new Date(graph.updatedAt))}
          </span>
        ) : (
          <span>Powered by Next.js 15 Canary + React Flow</span>
        )}
      </footer>
    </section>
  );
}
