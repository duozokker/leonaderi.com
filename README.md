# Leonaderi Interactive Portfolio World

Playable, Pokemon-like pixel portfolio website with modular content architecture.

Live page: <https://duozokker.github.io/leonaderi.com/>

## What Is Implemented
- 2D explorable overworld with retro pixel styling
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
src/
├─ content/
│  ├─ glossary.ts      # All locations + dialogs + actions
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

## Deployment
GitHub Pages deploy workflow:
- `.github/workflows/deploy-pages.yml`

Custom domain setup guide:
- `docs/07-github-pages-deploy.md`

## Asset + IP Note
Use CC0 or properly licensed assets. Avoid shipping direct Pokemon/Nintendo sprite IP without explicit permission.
See:
- `docs/05-assets-and-licensing.md`
- `assets/ASSET_LICENSES.md`
