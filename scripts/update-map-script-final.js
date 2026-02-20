import fs from 'fs';

const outPath = 'src/game/world/mapData.ts';
let content = fs.readFileSync(outPath, 'utf8');

const manifest = JSON.parse(fs.readFileSync('leonaderi-world-export/objects/manifest.json', 'utf8'));

// The magic formula
const OFFSET_X = 16;
const OFFSET_Y = 80;

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

const mapObjects = [];
let treeCount = 1;
for (const obj of manifest.objects) {
    if (obj.description.startsWith('Character:')) continue;
    let filename = getTargetFilename(obj);
    if (!filename) continue;
    
    let key = ''; let poiId = undefined; let collision = true; let hitbox = undefined;
    if (filename === 'bridge.png') { key = 'objBridge'; collision = false; }
    if (filename === 'linkedin_house.png') { key = 'objLinkedin'; poiId = 'linkedin-house'; hitbox = { x: 0, y: 6, width: 60, height: 55 }; }
    if (filename === 'company_hall.png') { key = 'objCompanyHall'; poiId = 'company-hq'; hitbox = { x: 0, y: 14, width: 85, height: 55 }; }
    if (filename === 'cv_archive.png') { key = 'objCvArchive'; poiId = 'projects-lab'; hitbox = { x: 0, y: 0, width: 70, height: 60 }; }
    if (filename === 'twitter_ruin.png') { key = 'objTwitterRuin'; poiId = 'twitter-house'; }
    if (filename === 'flower_patch.png') { key = 'objFlowerPatch'; collision = false; }
    if (filename === 'youtube_ruin.png') { key = 'objYoutubeRuin'; poiId = 'youtube-house'; }
    if (filename === 'github_house.png') { key = 'objGithub'; poiId = 'github-house'; hitbox = { x: 0, y: 0, width: 80, height: 55 }; }
    if (filename === 'tree.png') { key = `objTree${treeCount++}`; collision = false; }

    const centerX = obj.boundingBox.x + OFFSET_X + obj.boundingBox.width / 2;
    const centerY = obj.boundingBox.y + OFFSET_Y + obj.boundingBox.height / 2;

    const mapObj = { 
        key, 
        filename, 
        x: centerX, 
        y: centerY, 
        width: obj.boundingBox.width, 
        height: obj.boundingBox.height, 
        depth: Math.floor(centerY + obj.boundingBox.height * 0.3), 
        poiId, 
        collision, 
        hitbox 
    };
    if (!poiId) delete mapObj.poiId;
    if (!collision) delete mapObj.collision;
    if (!hitbox) delete mapObj.hitbox;
    mapObjects.push(mapObj);
}
const objectsReplacement = `export const MAP_OBJECTS: MapObject[] = ` + JSON.stringify(mapObjects, null, 2);
content = content.replace(/export const MAP_OBJECTS: MapObject\[\] = \[[\s\S]*?\](?=\n\nexport const MAP_OVERLAY)/, objectsReplacement);

// NPC_POSITIONS
const npcPosRegex = /export const NPC_POSITIONS = \{([\s\S]*?)\}/;
const match = npcPosRegex.exec(content);
let psX = 629, psY = 245;
if (match) {
    const psMatch = match[1].match(/"playerSpawn":\s*\{\s*"x":\s*([\d.]+),\s*"y":\s*([\d.]+)\s*\}/);
    if (psMatch) { psX = parseFloat(psMatch[1]); psY = parseFloat(psMatch[2]); }
}

const npcPositions = { playerSpawn: { x: psX, y: psY } };
let guideCount = 1;
for (const obj of manifest.objects) {
    if (!obj.description.startsWith('Character:')) continue;
    let npcKey = null;
    if (obj.description.includes('Guide NPC')) { npcKey = guideCount === 1 ? 'guide' : 'guideNpc2'; guideCount++; }
    else if (obj.description.includes('Recruiter NPC')) npcKey = 'recruiter';
    else if (obj.description.includes('Village NPC')) npcKey = 'villageNpc';
    else if (obj.description.includes('cute girl')) npcKey = 'cuteGirl';
    
    if (npcKey) {
        const centerX = obj.boundingBox.x + OFFSET_X + obj.boundingBox.width / 2;
        const centerY = obj.boundingBox.y + OFFSET_Y + obj.boundingBox.height / 2;
        npcPositions[npcKey] = { x: centerX, y: centerY };
    }
}
const npcPosReplacement = `export const NPC_POSITIONS = ` + JSON.stringify(npcPositions, null, 2);
content = content.replace(/export const NPC_POSITIONS = \{[\s\S]*?\}(?=\n\nexport const PLAYER_SPAWN)/, npcPosReplacement);

fs.writeFileSync(outPath, content);
console.log('Fixed final precise map coordinates!');
