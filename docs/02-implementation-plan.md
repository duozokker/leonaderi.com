# Implementation Plan

## Phase 0: Foundations (done in this prep pass)
- Bootstrap project with React + TypeScript + Vite.
- Add architecture and documentation skeleton.
- Define content model and starter glossary.
- Prepare GitHub Pages deployment workflow.

## Phase 1: First Playable Vertical Slice
- Integrate Phaser 3 runtime.
- Build one overworld map with:
  - spawn point
  - collisions
  - camera follow
  - one NPC
  - one building interaction
- Add intro modal + controls hint.

## Phase 2: Portfolio Content Layer
- Implement all initial POIs:
  - LinkedIn house
  - GitHub house
  - Company HQ
  - Projects workshop
  - two coming-soon houses
- Add dialog UI with:
  - title
  - pixel-art preview
  - description text
  - CTA buttons
- Add confirm-before-redirect modal for external links.

## Phase 3: Mobile + Accessibility + Polish
- Virtual joystick + interact button.
- Touch-safe hitboxes and target sizes.
- Audio feedback and subtle animation polish.
- Responsive layout hardening for small screens.

## Phase 4: Launch
- GitHub Pages deploy from `main`.
- Custom domain DNS setup and verification.
- Optional: Open-source community README polish and contribution guide.

## Phase 5: Expansion
- YouTube/Twitter buildings.
- Seasonal/event easter eggs.
- Achievements and collectible badges.
- Optional save-state for visited POIs.

