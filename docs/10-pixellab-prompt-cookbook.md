# PixelLab Prompt Cookbook (Topdown Tilesets)

Goal: reproducible retro world tiles for our modular portfolio game.

## Online Research (Key Findings)
- PixelLab tilesets are Wang/autotile based and expose the exact controls we need:
  `lower_description`, `upper_description`, `transition_description`, `tile_size`, `text_guidance_scale`, `outline`, `shading`, `detail`, `transition_size`, `tile_strength`, `tileset_adherence`, `tileset_adherence_freedom`, `seed`.
- Stardew Valley maps use a 16x16 tile grid, which aligns with classic readable top-down pixel layouts.
- Aseprite indexed-color workflow is a good constraint anchor when aiming for cleaner retro palettes.
- GBA sprite pipelines use 4bpp/16-color palettes per sprite tile, useful as an "early-gen readability" style direction.

## Source Links
- PixelLab API docs (`/tilesets`, `/create-tileset` params): <https://api.pixellab.ai/v2/llms.txt>
- PixelLab MCP docs overview: `pixellab://docs/overview`
- Stardew Valley 16x16 map tile grid: <https://stardewvalleywiki.com/Modding:Maps>
- Aseprite indexed color mode docs: <https://www.aseprite.org/docs/color-mode/>
- GBA 4bpp/16-color palette reference: <https://www.coranac.com/tonc/text/regobj.htm>

## Prompt Formula (That Actually Works)
Use this template:

`[material + shape] + [micro details] + [lighting/palette] + [retro readability target]`

Examples:
- `packed dirt path with small stones, warm highlights, cool shadows, crisp 16x16 readable clusters`
- `calm blue lake water with subtle wave pixels, limited palette, clean top-down retro tiles`

## Parameter Defaults For Our Style
- `tile_size`: `16x16`
- `view`: `high top-down`
- `outline`: `selective outline`
- `shading`: `medium shading`
- `detail`: `medium detail`
- `text_guidance_scale`: `10-12`
- `tile_strength`: `1.0`
- `tileset_adherence`: `100`
- `tileset_adherence_freedom`: `450-550`

Use `transition_size` as:
- `0.0`: hard edge
- `0.25`: sharp but natural border (great for paths)
- `0.5`: broader blend (great for shorelines/forest edges)

## Style Blocks (Legal-Safe)
Do not ask for direct Pokemon/Nintendo IP copies. Use style direction language.

### Early-Gen Monster Collector JRPG
`retro handheld JRPG inspired, limited palette, crisp silhouettes, strong tile readability, 16x16 cluster clarity`

### Cozy Farm-Sim
`cozy farm-sim pixel art, warm highlights, cool shadows, hand-placed texture feel, low-noise tiling`

### Neutral Production
`clean top-down pixel tileset, seamless autotile transitions, low visual noise, game-ready readability`

## Tested Prompt Starters
### 1) Water -> Grass
- lower: `calm blue lake water`
- upper: `lush short green grass`
- transition: `wet grassy shoreline with tiny pebbles, retro handheld JRPG inspired`
- settings: `transition_size=0.5`, `text_guidance_scale=11`

### 2) Grass -> Dirt Path
- lower: `lush short green grass`
- upper: `packed dirt path`
- transition: `trampled grass edge with tiny stones, crisp 16x16 readable clusters`
- settings: `transition_size=0.25`, `text_guidance_scale=11`

### 3) Dirt Path -> Stone Plaza
- lower: `packed dirt path`
- upper: `flat gray village stone paving`
- transition: `dusty stone border with tiny weeds in cracks`
- settings: `transition_size=0.25`, `text_guidance_scale=10`

### 4) Grass -> Forest Floor
- lower: `lush short green grass`
- upper: `dark forest floor with leaf litter`
- transition: `mossy leafy edge with cooler shadows`
- settings: `transition_size=0.5`, `text_guidance_scale=11`

## Chaining Strategy (Token-Efficient)
1. Generate one anchor transition (Water -> Grass).
2. Reuse returned base IDs.
3. For the next transition, pass previous `upper` ID as `lower_base_tile_id`.
4. Keep style params fixed across the chain for consistency.

Suggested chain:
- Water -> Grass
- Grass -> Dirt Path
- Dirt Path -> Stone Plaza
- Grass -> Forest Floor

## Avoid These Prompt Mistakes
- Too much lore text or story prose.
- Multiple unrelated biomes in one request.
- Conflicting style terms (`hyper-detailed` and `minimal` together).
- Direct trademark/IP terms if you want safe publish posture.
