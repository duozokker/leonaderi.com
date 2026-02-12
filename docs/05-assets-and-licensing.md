# Assets and Licensing

## Art Direction Target
- GBA-era top-down pixel look.
- Warm retro palette.
- Clear silhouettes for houses and NPCs.
- Pokemon vibe without Pokemon IP.

## Can We Use FireRed Sprites Directly?
Short answer: do not ship with original FireRed sprites unless you have explicit permission from the rights holders.

Safer strategy:
- use CC0/public-domain assets
- edit palette and details to your own identity
- keep a license log in the repo

## Recommended Legal Asset Sources

### 1) Kenney (CC0)
- Main support/license info: <https://kenney.nl/support>
- RPG Urban Pack: <https://kenney.nl/assets/rpg-urban-pack>
- Roguelike RPG Pack: <https://kenney.nl/assets/roguelike-rpg-pack>

Notes:
- Kenney states assets are public domain (CC0), including commercial use.

### 2) OpenGameArt (choose CC0 packs)
- Top Down Game Assets (CC0): <https://opengameart.org/content/top-down-game-assets>
- Top Down Tileset (CC0): <https://opengameart.org/content/top-down-tileset>
- Tiny Top Down Pack (CC0): <https://opengameart.org/content/tiny-top-down-pack>

Notes:
- Always verify each individual asset page license before using.

### 3) Palette Resources
- Lospec palette list: <https://lospec.com/palette-list>

## Production Asset Policy
- Every imported pack must be logged in `assets/ASSET_LICENSES.md`.
- Add source URL + license + author + date.
- Keep raw packs in a separate `assets/raw` folder, edited exports in `assets/game`.
- Never mix unverified ripped sprites into the production branch.

## Tooling
- Tiled for map layout: <https://doc.mapeditor.org/en/stable/manual/introduction/>
- Phaser tilemap loading docs: <https://docs.phaser.io/api-documentation/class/loader-loaderplugin>

## IP Risk Checklist Before Launch
- No Nintendo/Pokemon copyrighted sprites.
- No trademarked logos unless allowed (or use plain text labels).
- All sprite packs tracked with license evidence.

## Related Policy Reference
- Nintendo game content guidelines: <https://www.nintendo.co.jp/networkservice_guideline/en/index.html>
