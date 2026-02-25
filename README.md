# Leonaderi Interactive Portfolio World

Playable retro-style portfolio world built with Vite + TypeScript + Kaboom.

Live page: <https://leonaderi.com/>

## Runtime Source of Truth
The website is defined by:

- `index.html`
- `src/main.ts`
- `src/style.css`
- `src/content/glossary.ts`
- `src/content/types.ts`
- `src/game/world/mapData.ts`
- `public/assets/**` (sprites, map, pictures)

Everything else is optional tooling or deployment metadata.

## Quick Start
```bash
npm install
npm run dev
```

## Verification
```bash
npm test
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Content Editing
- Edit POIs, links, dialogs, metadata in `src/content/glossary.ts`.
- Edit map objects, NPC/player positions, terrain constants in `src/game/world/mapData.ts`.

## Deployment
- Vercel config: `vercel.json`
- Build command: `npm run build`
- Output directory: `dist`
