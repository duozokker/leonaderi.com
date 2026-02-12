# Leonaderi Interactive Portfolio

Pixel-art portfolio as an explorable game world (Pokemon FireRed inspired, but with original/legal assets).

## Vision
- Visitors spawn as a character in a retro town.
- They can explore buildings, talk to NPCs, read signs, and open external links.
- LinkedIn, GitHub, company website, projects, and future socials (YouTube/Twitter) are represented as in-world places.
- Desktop controls: `WASD` + arrow keys.
- Mobile controls: virtual joystick + interact button.

## Current Stage
This repository is prepared for implementation:
- modern web stack bootstrapped
- modular architecture and content glossary ready
- comprehensive docs for asset strategy, licensing, gameplay UX, and GitHub Pages deployment
- CI-ready GitHub Pages workflow included

## Tech Stack
- React + TypeScript + Vite
- Phaser 3 integration planned (next implementation phase)
- Tiled maps for world building
- Data-driven content model (`src/content/glossary.ts`)

## Project Structure
```txt
.
├─ .github/workflows/
│  └─ deploy-pages.yml
├─ docs/
│  ├─ 01-product-pitch.md
│  ├─ 02-implementation-plan.md
│  ├─ 03-architecture.md
│  ├─ 04-content-glossary.md
│  ├─ 05-assets-and-licensing.md
│  ├─ 06-easter-eggs.md
│  ├─ 07-github-pages-deploy.md
│  ├─ 08-portfolio-best-practices.md
│  └─ 09-reference-projects.md
├─ src/
│  ├─ content/
│  │  ├─ glossary.ts
│  │  └─ types.ts
│  ├─ game/
│  │  ├─ entities/
│  │  ├─ scenes/
│  │  └─ systems/
│  ├─ App.tsx
│  └─ ...
├─ AGENTS.md
└─ README.md
```

## Development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Next Steps
1. Install and wire Phaser 3.
2. Build first playable overworld map with collisions.
3. Add intro modal, dialog system, and link-confirm flow.
4. Implement mobile controls and accessibility checks.
5. Deploy on GitHub Pages and bind custom domain.

## Important IP Note
Do not use original Pokemon FireRed sprites directly in production without explicit permission from the rights holder. Use original or CC0-friendly assets and tune color palette + art direction to achieve a similar mood legally.
