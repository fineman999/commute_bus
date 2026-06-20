# Agent Instructions

## Project Context

This repository is a Vite + React + TypeScript SPA for checking Wonju commuter bus routes to Bangok-dong Innovation City and analyzing which route/stop is closest to a user-entered address.

Use `INFO.md` as the product brief and source of truth for requirements until a more detailed spec exists. The current app is still close to the Vite starter template, so most real application structure has not been implemented yet.

## Product Goal

Build a practical home-search helper:

- Show 9 commuter bus routes and their stops.
- Let users compare routes by neighborhood/dong.
- Let users enter an address or location and get the nearest Top 3 stops/routes.
- Visualize routes, stops, and selected recommendations on a map once coordinates are available.

## Current State

- Existing stack: Vite, React, TypeScript.
- Current dependencies only include React and React DOM.
- `src/App.tsx`, `src/index.css`, and `src/App.css` are still mostly Vite starter UI.
- `INFO.md` proposes React Router, Zustand, Leaflet/react-leaflet, Tailwind CSS, and geocoding, but these are not installed yet.

## Recommended Development Order

### Phase 1: Data and Core UI

Start here. Do not begin with map integration.

1. Replace the starter UI with a real app shell.
2. Add domain types:
   - `src/types/route.ts`
   - `Stop`
   - `BusRoute`
   - `NearestResult`
3. Add hardcoded route data:
   - `src/data/routes.ts`
   - Include the 9 routes from `INFO.md`.
   - If exact coordinates are not known, keep `lat` and `lng` optional.
4. Add the Haversine utility:
   - `src/lib/distance.ts`
   - Include unit-like sanity checks if a test framework is added later.
5. Build basic components without external map dependency:
   - route list
   - selected route detail
   - neighborhood summary
   - nearest stop results from known coordinates only

This phase should make the app useful even before a map exists.

### Phase 2: Coordinate Data

Coordinates are the biggest data risk. Treat them as data work, not UI work.

Preferred approach:

1. Collect stop coordinates once.
2. Store verified coordinates in `src/data/routes.ts` or a separate data file.
3. Avoid runtime geocoding for static stop names when possible.

Do not silently invent coordinates. If coordinates are approximate, mark them clearly in comments or metadata.

### Phase 3: Address Analysis

Add address-to-coordinate support after stop coordinates exist.

Preferred order:

1. Implement a geocoding abstraction in `src/lib/geocode.ts`.
2. Prefer Kakao Local API for Korean address accuracy if an API key is available.
3. Support a no-key fallback only if it is reliable enough for development.
4. Keep API keys in environment variables. Do not commit secrets.

The nearest-stop logic should stay independent from the geocoding provider.

### Phase 4: Map

Add Leaflet/react-leaflet only after route and coordinate data are stable.

Map should render:

- all or selected route stops
- route polylines when coordinates are available
- user-selected location
- line from user location to recommended stops

If map dependencies are added, remember Leaflet CSS and marker asset handling.

### Phase 5: Routing, State, and Polish

Only add React Router and Zustand when the app has enough state to justify them.

- React Router is useful for route detail pages or shareable analysis pages.
- Zustand is useful if selected route/search/result state becomes shared across many components.
- Avoid adding these dependencies before they solve a concrete problem.

## Implementation Guidelines

- Prefer small, typed modules under `src/types`, `src/data`, `src/lib`, and `src/components`.
- Keep distance calculation pure and dependency-free.
- Keep geocoding side effects isolated in `src/lib/geocode.ts`.
- Use Korean UI copy because the target domain is Wonju commuter bus users.
- Do not overbuild a marketing landing page. The first screen should be the usable route/search experience.
- If exact bus stop names or coordinates are uncertain, expose the uncertainty in code comments or UI labels instead of pretending they are verified.

## Suggested Initial File Structure

```text
src/
  main.tsx
  App.tsx
  types/
    route.ts
  data/
    routes.ts
  lib/
    distance.ts
  components/
    RouteList.tsx
    RouteDetail.tsx
    NeighborhoodSummary.tsx
    AddressSearch.tsx
    NearestResults.tsx
```

Add `pages/`, `store/`, and map components later when the app actually needs them.

## Commands

Use the existing package scripts:

```bash
npm run dev
npm run build
npm run lint
```

When adding dependencies, prefer the smallest set needed for the current phase. For Phase 1, no additional runtime dependencies are required.

## Near-Term Backlog

1. Replace Vite starter screen with a route analysis dashboard.
2. Add typed route data for all 9 routes from `INFO.md`.
3. Add `haversineKm` and `findNearest`.
4. Add route selection and neighborhood recommendation UI.
5. Add placeholder state for address analysis until coordinates/geocoding are ready.
6. Verify build and lint.

## Important Constraints

- Do not commit API keys.
- Do not rely on live geocoding for every static stop at runtime.
- Do not use straight-line distance as the only recommendation signal without explaining that it is approximate.
- Do not introduce broad refactors while the app is still being scaffolded.
