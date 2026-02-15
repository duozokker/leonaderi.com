# Leonaderi Interactive Portfolio World

Playable, Pokemon-like pixel portfolio website with modular content architecture.

Live page: <https://duozokker.github.io/leonaderi.com/>

## What Is Implemented
- 2D explorable overworld with retro pixel styling
- PixelLab autotile terrain overlays (water shoreline + dirt path transitions)
- Character spawn + movement (`WASD` / arrows)
- Mouse hover tooltips for houses, NPCs, and signs
- Interaction via `E`, `Enter`, `Space`, or click
- Mobile controls (on-screen D-pad + interact button)
- Modular content registry for houses/NPCs/signs in `src/content/glossary.ts`
- Dialog windows with pixel preview and contextual actions
- Confirm-before-redirect flow for external links
- Company HQ, LinkedIn, GitHub, projects, social buildings, coming-soon + ruins states
- GitHub Pages deployment workflow

## Quick Start
```bash
npm install
npm run dev
```

Worldbuilder V2 (separate local app):
```bash
npm run worldbuilder:dev
```

Compile world JSON to runtime files:
```bash
npm run world:validate
npm run world:compile
```

Build + preview:
```bash
npm run build
npm run preview
```

## Configure Your Real Links
Edit only this file:
- `src/content/profile.ts`

Then adjust content or add new houses in:
- `src/content/glossary.ts`

## Project Structure
```txt
apps/
└─ worldbuilder/       # Separate local world editor (React + Konva + React Flow)
packages/
├─ world-schema/       # Authoring/runtime zod schemas
└─ world-compiler/     # JSON -> runtime TS compiler bridge
world-data/
└─ project.world.v1.json
src/
├─ content/
│  ├─ glossary.ts      # GENERATED from world-data compiler
│  ├─ profile.ts       # Central social/company URLs
│  └─ types.ts         # Typed data model
├─ game/
│  ├─ core/eventBus.ts
│  ├─ scenes/OverworldScene.ts
│  ├─ systems/mobileInputState.ts
│  └─ entities/interactable.ts
├─ ui/
│  ├─ components/
│  └─ hooks/
└─ App.tsx
```

Detailed worldbuilder docs:
- `docs/worldbuilder-v2.md`

## Deployment
GitHub Pages deploy workflow:
- `.github/workflows/deploy-pages.yml`

Custom domain setup guide:
- `docs/07-github-pages-deploy.md`

## Asset + IP Note
Use CC0 or properly licensed assets. Avoid shipping direct Pokemon/Nintendo sprite IP without explicit permission.
See:
- `docs/05-assets-and-licensing.md`
- `docs/10-pixellab-prompt-cookbook.md`
- `assets/ASSET_LICENSES.md`
