# MTA React Flow Explorer

An experimental Next.js 15 (canary) experience that visualises NYC Subway routes using React Flow. It pairs the static GTFS
route/stop CSVs in `data/` with a stylised network layout that you can pan and zoom.

https://github.com/your-org/mta-api

## Features

- **Next.js 15 Canary + React 18** – modern app directory architecture with server components.
- **React Flow canvas** – interactive rendering of each subway line with minimap, controls, and animated edges.
- **Route-aware station filtering** – heuristics derived from the GTFS stop identifiers to approximate which stations serve a
  given route when the static data does not list memberships explicitly.
- **API endpoint** – `/api/routes/[routeId]/graph` returns the computed graph JSON so the UI and any external consumers can share
  the same data.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

> **Note:** The canary releases used here may require Node.js 18.17 or newer.

## Project structure

```
src/
  app/
    page.tsx           // Server component that prepares the initial graph
    layout.tsx         // Root layout + metadata
    api/routes/[routeId]/graph/route.ts  // Graph JSON API route
  components/
    RouteFlowClient.tsx // Client component hosting the React Flow canvas
  lib/
    gtfs.ts            // Parsers + lightweight caches for routes/stops
    graph.ts           // Builds graph nodes/edges for a specific route
    routeMatching.ts   // GTFS route heuristics reused from the original API
```

## Data notes

The shipped GTFS static files do not encode every route/stop relationship. The heuristics in `src/lib/routeMatching.ts` infer
likely matches based on parent station identifiers and route naming conventions. Some lines may therefore appear sparse until
richer data is provided.

## Scripts

- `npm run dev` – start the Next.js dev server with hot reloading.
- `npm run build` – create an optimised production build.
- `npm run start` – launch the production server (after building).
- `npm run lint` – run ESLint with the Next.js configuration.

## License

MIT
