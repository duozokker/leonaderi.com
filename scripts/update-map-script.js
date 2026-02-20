import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Utility function to determine the target filename for an exported object
function getTargetFilename(obj) {
    const desc = obj.description;
    if (desc.includes('bridge')) return 'bridge.png';
    if (desc.includes('LinkedIn')) return 'linkedin_house.png';
    if (desc.includes('company_hall')) return 'company_hall.png';
    if (desc.includes('cv_archive')) return 'cv_archive.png';
    if (desc.includes('twitter_ruin')) return 'twitter_ruin.png';
    if (desc.includes('flower_patch')) return 'flower_patch.png';
    if (desc.includes('youtube_ruin')) return 'youtube_ruin.png';
    if (desc.includes('github house')) return 'github_house.png';
    if (desc.includes('tree')) return 'tree.png';
    return null;
}

const manifestPath = 'leonaderi-world-export/objects/manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const outDir = 'public/assets/game/map/objects';

// 1. Copy Map Composite
fs.copyFileSync('leonaderi-world-export/map-composite.png', 'public/assets/game/map/map-composite.png');
console.log('Copied map-composite.png');

// 2. Copy and rename Objects
const mapObjects = [];
let treeCount = 1;
let guideCount = 1;
const npcPositions = {};

for (const obj of manifest.objects) {
    const isChar = obj.description.startsWith('Character:');
    
    if (isChar) {
        let npcKey = null;
        if (obj.description.includes('Guide NPC')) {
            npcKey = guideCount === 1 ? 'guide' : 'guideNpc2';
            guideCount++;
        } else if (obj.description.includes('Recruiter NPC')) {
            npcKey = 'recruiter';
        } else if (obj.description.includes('Village NPC')) {
            npcKey = 'villageNpc';
        } else if (obj.description.includes('cute girl')) {
            npcKey = 'cuteGirl';
            // copy the image too!
            fs.copyFileSync(`leonaderi-world-export/objects/${obj.filename}`, `public/assets/game/pixellab/characters/npc/cute_girl.png`);
        } else if (obj.description.includes('Portfolio Hero')) {
            // we keep original spawn, skip
        }
        
        if (npcKey) {
            npcPositions[npcKey] = { x: obj.boundingBox.x, y: obj.boundingBox.y };
        }
        continue;
    }
    
    let filename = getTargetFilename(obj);
    if (!filename) {
        console.warn('Unknown object:', obj.description);
        filename = obj.filename; // fallback
    }

    const srcFile = `leonaderi-world-export/objects/${obj.filename}`;
    const destFile = path.join(outDir, filename);
    
    if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`Copied ${srcFile} to ${destFile}`);
    }

    // Prepare MAP_OBJECTS entry
    let key = '';
    let poiId = undefined;
    let collision = true;
    let hitbox = undefined;
    
    if (filename === 'bridge.png') { key = 'objBridge'; collision = false; }
    if (filename === 'linkedin_house.png') { key = 'objLinkedin'; poiId = 'linkedin-house'; hitbox = { x: 0, y: 6, width: 60, height: 55 }; }
    if (filename === 'company_hall.png') { key = 'objCompanyHall'; poiId = 'company-hq'; hitbox = { x: 0, y: 14, width: 85, height: 55 }; }
    if (filename === 'cv_archive.png') { key = 'objCvArchive'; poiId = 'projects-lab'; hitbox = { x: 0, y: 0, width: 70, height: 60 }; }
    if (filename === 'twitter_ruin.png') { key = 'objTwitterRuin'; poiId = 'twitter-house'; }
    if (filename === 'flower_patch.png') { key = 'objFlowerPatch'; collision = false; }
    if (filename === 'youtube_ruin.png') { key = 'objYoutubeRuin'; poiId = 'youtube-house'; }
    if (filename === 'github_house.png') { key = 'objGithub'; poiId = 'github-house'; hitbox = { x: 0, y: 0, width: 80, height: 55 }; }
    if (filename === 'tree.png') { key = `objTree${treeCount++}`; collision = false; }

    const mapObj = {
        key,
        filename,
        x: obj.boundingBox.x,
        y: obj.boundingBox.y,
        width: obj.boundingBox.width,
        height: obj.boundingBox.height,
        depth: Math.floor(obj.boundingBox.y + obj.boundingBox.height * 0.8), // arbitrary depth estimation
        poiId,
        collision,
        hitbox
    };
    
    if (!poiId) delete mapObj.poiId;
    if (!collision) delete mapObj.collision;
    if (!hitbox) delete mapObj.hitbox;
    
    mapObjects.push(mapObj);
}

// 3. Process TERRAIN_GRID
const terrainJson = JSON.parse(fs.readFileSync('leonaderi-world-export/terrain-map.json', 'utf8'));
const MAP_ROWS = 42;
const MAP_COLUMNS = 66;
const MAP_Y_OFFSET = 4;
const grid = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLUMNS).fill(1)); // default T_WATER=1

for (const cell of terrainJson.cells) {
    const r = cell.y + MAP_Y_OFFSET;
    const c = cell.x;
    if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLUMNS) {
        grid[r][c] = cell.terrainId;
    }
}

// 4. Update src/game/world/mapData.ts
let mapData = fs.readFileSync('src/game/world/mapData.ts', 'utf8');

// Replace TERRAIN_GRID
const terrainReplacement = `export const TERRAIN_GRID: number[][] = [\n` + grid.map(row => `  [ ${row.join(', ')} ]`).join(',\n') + `\n]`;
mapData = mapData.replace(/export const TERRAIN_GRID[\s\S]*?\](?=\n\nexport const TILESET_DEFS)/, terrainReplacement);

// Replace MAP_OBJECTS
const objectsReplacement = `export const MAP_OBJECTS: MapObject[] = ` + JSON.stringify(mapObjects, null, 2);
mapData = mapData.replace(/export const MAP_OBJECTS: MapObject\[\] = \[[\s\S]*?\](?=\n\nexport const MAP_OVERLAY)/, objectsReplacement);

// Update NPC_POSITIONS without touching playerSpawn
const npcPosRegex = /export const NPC_POSITIONS = \{([\s\S]*?)\}/;
const match = npcPosRegex.exec(mapData);
if (match) {
    let currentNpcsStr = match[1];
    // extract playerSpawn manually
    const psMatch = currentNpcsStr.match(/"playerSpawn":\s*\{\s*"x":\s*([\d.]+),\s*"y":\s*([\d.]+)\s*\}/);
    if (psMatch) {
        npcPositions.playerSpawn = { x: parseFloat(psMatch[1]), y: parseFloat(psMatch[2]) };
    }
    const npcPosReplacement = `export const NPC_POSITIONS = ` + JSON.stringify(npcPositions, null, 2);
    mapData = mapData.replace(/export const NPC_POSITIONS = \{[\s\S]*?\}/, npcPosReplacement);
}

fs.writeFileSync('src/game/world/mapData.ts', mapData);
console.log('Updated src/game/world/mapData.ts');

