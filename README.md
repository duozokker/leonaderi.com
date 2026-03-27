# Leonaderi Interactive Portfolio World

Playable retro portfolio world built with Vite, TypeScript, and Kaboom.

Live site: [leonaderi.com](https://leonaderi.com/)

## What This Repo Contains

This project is a single-page pixel-world portfolio. Visitors move through a small town, interact with buildings and NPCs, and open external profile or business links through in-world dialogs.

The runtime source of truth is intentionally small:

- `index.html` wires the HUD, onboarding, dialog shell, and SEO metadata.
- `src/main.ts` contains the Kaboom runtime, interactions, movement, UI wiring, and language toggle logic.
- `src/game/world/mapData.ts` contains map geometry, object placement, and NPC spawn data.
- `src/content/glossary.ts` contains POI metadata, labels, links, and dialog content backing the world.
- `src/content/types.ts` defines the content model.
- `src/style.css` contains all HUD/dialog/mobile-control styling.
- `public/assets/**` contains sprites, map composites, and profile imagery.

## Quick Start

```bash
npm install
npm run dev
```

Open the local Vite URL and use `WASD`, arrow keys, or the mobile controls.

## Verification

```bash
npm run verify
```

That command runs:

- `npm run lint`
- `npm test`
- `npm run build`

To preview the production build locally:

```bash
npm run preview
```

## Content Editing

Use these files when updating the world without changing engine behavior:

- `src/content/glossary.ts` for POI copy, labels, actions, and metadata.
- `src/game/world/mapData.ts` for building placement, NPC coordinates, and collision/map constants.
- `public/assets/game/**` for sprites and map object imagery.
- `public/assets/pictures/**` for HUD, dialog, and social preview images.

## Deployment

The app is deployment-ready as a static SPA.

- Vercel is configured through [`vercel.json`](/Users/schayan/Dev/leonaderi.com/vercel.json).
- Production output is written to `dist/`.
- SPA routing is handled by rewriting unknown routes back to `index.html`.
- `vite.config.ts` also supports GitHub Pages-style subpath builds in CI by adjusting `base` from `GITHUB_REPOSITORY`.

Typical host settings:

- Build command: `npm run build`
- Output directory: `dist`
- Node version: current active LTS is recommended

## Environment Variables

No environment variables are required for the current public build.

The checked-in [`/.env.example`](/Users/schayan/Dev/leonaderi.com/.env.example) is intentionally minimal to make that explicit.

## Use This As A Template

If you want to build a similar playable portfolio world:

1. Replace the profile images in `public/assets/pictures/`.
2. Swap map sprites and buildings in `public/assets/game/`.
3. Update POIs, links, labels, and dialogs in `src/content/glossary.ts`.
4. Adjust world placement and NPC positions in `src/game/world/mapData.ts`.
5. Run `npm run verify` before deploying.

The current structure is intentionally simple so an LLM or another contributor can modify content and layout without needing to rewrite the engine.

## Release Notes For Contributors

- Keep changes minimal and preserve current movement, collision, and dialog behavior unless a change is explicitly intended.
- Prefer updating content data and assets over adding more hardcoded runtime branches.
- If you add new runtime-loaded assets, update the tests in `tests/` so broken asset paths are caught before deployment.
