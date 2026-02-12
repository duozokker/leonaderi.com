# Assets and Licensing

## Art Direction Target
- Retro handheld / early-gen inspired top-down pixel look.
- Cozy farm-town atmosphere.
- Crisp silhouettes and readable 16x16 terrain transitions.
- No direct Nintendo/Pokemon copyrighted assets.

## Can We Use FireRed Sprites Directly?
Short answer: no, unless you have explicit written permission from the rights holders.

Safe strategy:
- Use generated or properly licensed assets.
- Keep prompt and metadata history for reproducibility.
- Track every imported/generated file in `assets/ASSET_LICENSES.md`.

## Selected Asset Strategy (Current)
- Primary world terrain: PixelLab generated topdown Wang tilesets
- Player + NPC visuals: PixelLab generated 4-direction character rotations
- Decor (sign/tree): PixelLab generated decor tiles

Rationale:
- Consistent style language across world, characters, and props
- Modular pipeline (easy regeneration/replacement)
- Works with Phaser and tile-based architecture

## Production Asset Policy
- Every imported/generated pack must be logged in `assets/ASSET_LICENSES.md`.
- Keep generation metadata JSON with the PNG output.
- Keep prompts documented for repeatable style updates.
- Re-check PixelLab account terms before commercial launch.

## Tooling
- Phaser docs: <https://docs.phaser.io/>
- PixelLab API parameters: <https://api.pixellab.ai/v2/llms.txt>

## IP Risk Checklist Before Launch
- No Nintendo/Pokemon copyrighted sprites.
- No trademarked logos without permission.
- Asset sources and license notes documented in-repo.
