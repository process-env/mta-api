# MTA Express Next

This project ports the MTA Express API into a Next.js 15 application with a small UI that emulates the classic black station signage with colored route bullets. It includes REST endpoints for routes, stops, GTFS feed groups, and a React Flow powered station preview.

## Getting started

```bash
pnpm install
cp .env.example .env
# Optionally edit .env to provide MTA_API_KEY
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) to use the search UI.

## Environment variables

| Variable | Description |
| --- | --- |
| `MTA_API_KEY` | Optional key for live GTFS data. Without it, a bundled sample feed keeps arrivals working. |
| `FEED_BASE_URL` | Override the GTFS API host (default `https://api.mta.info/`). |
| `CACHE_TTL_MS` | Feed cache TTL in milliseconds (default `15000`). |

An `.env.example` file is provided with placeholders.

## Scripts

- `pnpm dev` – run Next.js in development mode.
- `pnpm build` – create an optimized production build.
- `pnpm start` – run the production server.
- `pnpm lint` – run `next lint`.
- `pnpm typecheck` – run TypeScript in no-emit mode.

## API overview

- `GET /api/health` – quick liveness check.
- `GET /api/v1/routes` – list of subway routes from `data/routes.txt`.
- `GET /api/v1/routes/:routeId/stops` – stops inferred to serve a route (supports compatibility trailing IDs).
- `GET /api/v1/stops?query=Times%20Sq&route=N` – fuzzy stop search with optional route filter.
- `GET /api/v1/stops/:stopId` – stop details by GTFS ID (returns `[]` when unknown).
- `GET /api/v1/feed` – available GTFS feed groups.
- `GET /api/v1/feed/:groupId` – cached realtime feed data with sample fallback.
- `GET /api/v1/arrivals/:groupId/:stopId` – next arrivals derived from the feed.

All endpoints respond with JSON.
