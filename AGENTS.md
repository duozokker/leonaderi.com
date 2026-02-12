# AGENTS.md

## Project Goal
Build a game-like portfolio website in retro pixel style where visitors explore a town and discover profile, projects, and company information through interactive world elements.

## Non-Negotiables
- Keep architecture modular and data-driven.
- All content entries must come from `src/content/glossary.ts`.
- Every external link must open through a confirmation modal first.
- Desktop and mobile controls must both work before release.
- Avoid copyrighted Nintendo/Pokemon assets unless explicit written permission exists.

## Working Rules
- Favor small, composable components and explicit types.
- Keep game logic separate from UI overlay logic.
- Keep URLs, labels, and metadata in glossary/content files, not hardcoded in scene logic.
- Add docs when introducing new systems (scene, input, dialogs, state).

## Code Layout Expectations
- `src/game/scenes`: Phaser scenes only.
- `src/game/systems`: mechanics (interaction, collision, portals, camera, input adapters).
- `src/game/entities`: player, npc, buildings, signage abstractions.
- `src/content`: canonical data model and seed content.
- `src/ui` (to be added): overlays/modals/menu/dialogs.

## Quality Gate Before Merge
- `npm run lint`
- `npm run build`
- Mobile viewport sanity check
- Keyboard-only navigation sanity check for core UI modals

## Deployment
- GitHub Pages via `.github/workflows/deploy-pages.yml`.
- Keep `vite.config.ts` base-path logic compatible with repository pages and user pages.

