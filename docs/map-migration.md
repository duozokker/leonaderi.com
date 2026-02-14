# Map Migration Workflow

## Goal
Use a PixelLab export folder (for example `map-v1`) as source of truth for:
- terrain grid
- map objects and their hitbox sizes
- overlay placement
- NPC and player spawn positions
- copied map asset files in `public/assets/game/map`

## Run
```bash
npm run map:migrate -- map-v1
```

If no folder is passed, the script defaults to `map-v1`.

## What gets updated automatically
- `src/game/world/mapData.ts`
- `public/assets/game/map/objects/*.png` (known mapped objects)
- `public/assets/game/map/tilesets/*.png` (known terrain pair mappings)
- `public/assets/game/map/overlays/overlay_0.png`

## Important assumptions
- Object/NPC detection uses names/descriptions from `objects/manifest.json` (for example `Imported: github_house.png`, `Guide NPC`, `tree`).
- Three trees are assigned by Y-order (top/mid/bottom).
- Export/object coordinate conversion uses:
  - map Y offset from bounding box (`minY`)
  - additional object shift `+16px X / +16px Y`

## What stays manual
- `src/content/glossary.ts` content and links
- Dialog text/content strategy
- New POIs that do not match existing object mapping keys
- Scene behavior changes that are not pure map data

## In-game offset debug (optional)
If a new export still looks slightly shifted, you can tune it live:
- `F8`: toggle offset debug panel
- `Z/X`: move objects + interactables on X axis
- `C/V`: move objects + interactables on Y axis
- `B`: reset offset to `0,0`
- `[` / `]`: select previous/next solid object
- `Arrow keys`: move selected hitbox
- `Shift + Arrow keys`: resize selected hitbox
- `R`: reset selected hitbox override
- `P`: copy current hitbox overrides as JSON to clipboard

Offsets are stored in browser `localStorage` key `map-object-offset`.
Hitbox overrides are stored in browser `localStorage` key `map-hitbox-overrides`.
Opening the panel requires a password, validated against SHA-256 hash from `VITE_DEBUG_MENU_HASH`
in `.env` (with a hardcoded fallback hash in code for reproducible setups).

## When migration fails
The script throws if expected objects are missing or duplicated (for example more than one `github` match).  
Fix the map export naming/description (or update selector logic in `scripts/map/migrate-map.mjs`) and rerun.
