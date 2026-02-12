# Architecture Blueprint

## Stack
- Frontend shell: React + TypeScript + Vite
- Game engine: Phaser 3 (next phase)
- Map editor: Tiled (`.tmj`/JSON tilemaps)
- State split:
  - game state in Phaser systems
  - UI overlay state in React store/context

## Module Boundaries
- `src/game/scenes`: scene lifecycle and orchestration
- `src/game/entities`: player/NPC/building/sign behavior wrappers
- `src/game/systems`: movement, interactions, collisions, camera, portals
- `src/content`: declarative content data
- `src/ui` (planned): modal/dialog/menu components

## Scene Strategy
- `BootScene`: preload assets and fonts.
- `OverworldScene`: main map, movement, interactions.
- `InteriorScene_*`: optional per-building interiors.
- `UIScene` (optional): in-canvas HUD if needed.

## Interaction Contract
All interactables share a common shape:
- `id`
- `kind`
- `status`
- `position` / map anchor
- `dialog payload`
- `actions[]`

This allows adding/replacing content without changing core interaction code.

## Data-Driven Content
`src/content/glossary.ts` is the canonical source for:
- links
- projects
- NPC text
- sign text
- status (`live`, `wip`, `coming_soon`, `ruins`)

## Scalability Notes
- Prefer composition over huge scene files.
- Keep feature flags for experimental easter eggs.
- Keep asset metadata and licenses documented in-repo.

