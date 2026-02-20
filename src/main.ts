import kaboom from "kaboom";
import type { GameObj, KaboomCtx, Key } from "kaboom";
import { MAP_OBJECTS, PLAYER_SPAWN, NPC_POSITIONS, TERRAIN_GRID, T_WATER, MAP_TILE_SIZE } from "./game/world/mapData";
import { portfolioGlossary } from "./content/glossary";

declare global {
    interface Window {
        _injectDialogButtons?: () => void;
    }
}

let currentLang: "en" | "de" = "en";

const t = {
    en: {
        onboardingTitle: "Welcome to Leo's World",
        onboardingBody: "Use WASD or tap the screen / joystick to move.<br>Press SPACE at the buildings for info.",
        startGame: "Start Game",
        profileDesc: "Developer & Creator",
        cancel: "Cancel",
        npcGuideTitle: "Guide",
        npcGuideText: "Hey there! Did you know Leo built this entire engine from scratch using Kaboom.js? He specializes in high-performance web apps and interactive experiences. Take a look around!",
        npcRecruiterTitle: "Recruiter",
        npcRecruiterText: "I've been looking for a 10x engineer everywhere! Leo's architecture here is pristine – zero-allocation game loops, perfect memory management... it's a masterpiece.",
        npcRecruiterEasterEgg: "You're persistent, I like that! You're hired! Have some celebration confetti! 🎉",
        npcVillagerTitle: "Local Dev",
        npcVillagerText: "I heard Leo uses modern tech stacks like React, TypeScript, and Vite. He even built a custom map compiler for this world to parse Wang tiles seamlessly!",
        npcProjectsTitle: "Architect",
        npcProjectsText: "Leo is obsessed with clean UX. Notice how smoothly the camera follows you and how snappy the dialogs feel? That's his signature frontend polish.",
        pois: {
            "company-hq": {
                title: "Artesiana HQ",
                body: "Here you can see my business profile, services, and how to start a project with me.",
                actions: { "company-website": "Open Artesiana Website", "company-services": "Show Services" }
            },
            "construction-ruins": {
                title: "Production Zone",
                body: "This house will be repaired and unlocked with new content later.",
                actions: { "ruins-soon": "Currently Closed" }
            },
            "github-house": {
                title: "GitHub Workshop",
                body: "Here visitors can see my code, commit history, and active projects.",
                actions: { "github-open": "Open GitHub" }
            },
            "linkedin-house": {
                title: "LinkedIn",
                body: "This leads directly to my CV and professional profile.",
                actions: { "linkedin-open": "Open LinkedIn" }
            },
            "projects-lab": {
                title: "Fun Projects Lab",
                body: "Here are my cool experiments, side projects, and demos.",
                actions: { "projects-list": "Show Project List" }
            },
            "sign-about": {
                title: "About This World",
                body: "This website is my portfolio world. Every location represents a part of my work.",
                actions: { "action-sign-about-coming-soon": "Coming soon" }
            },
            "sign-controls": {
                title: "Controls",
                body: "Desktop: WASD or Arrows. Interact: E, Enter, Space or Click. Mobile: D-Pad + Interact.",
                actions: { "action-sign-controls-coming-soon": "Coming soon" }
            },
            "twitter-house": {
                title: "Twitter Kiosk",
                body: "This channel is being prepared. You can activate it later via the glossary.",
                actions: { "twitter-open": "Open Twitter" }
            },
            "youtube-house": {
                title: "YouTube Studio",
                body: "This location is under construction. Video formats will appear here soon.",
                actions: { "youtube-soon": "Coming Soon" }
            }
        }
    },
    de: {
        onboardingTitle: "Willkommen in Leos Welt",
        onboardingBody: "Nutze WASD oder tippe auf den Bildschirm / Joystick, um dich zu bewegen.<br>Drücke SPACE an Gebäuden für Infos.",
        startGame: "Start Game",
        profileDesc: "Entwickler & Creator",
        cancel: "Abbrechen",
        npcGuideTitle: "Guide",
        npcGuideText: "Hallo! Wusstest du, dass Leo diese ganze Engine von Grund auf mit Kaboom.js gebaut hat? Er ist Experte für hochperformante Web-Apps und interaktive Erlebnisse. Schau dich ruhig um!",
        npcRecruiterTitle: "Recruiter",
        npcRecruiterText: "Ich suche überall nach einem 10x Engineer! Leos Architektur hier ist makellos – Zero-Allocation Game Loops, perfektes Speichermanagement... Ein Meisterwerk.",
        npcRecruiterEasterEgg: "Du bist hartnäckig, das gefällt mir! Du bist eingestellt! Nimm etwas Konfetti! 🎉",
        npcVillagerTitle: "Local Dev",
        npcVillagerText: "Ich habe gehört, Leo nutzt moderne Tech-Stacks wie React, TypeScript und Vite. Er hat sogar einen eigenen Map-Compiler für diese Welt geschrieben, um die Wang-Tiles nahtlos zu parsen!",
        npcProjectsTitle: "Architekt",
        npcProjectsText: "Leo liebt saubere UX. Bemerkst du, wie flüssig die Kamera dir folgt und wie snappy die Dialoge sind? Das ist sein typischer Frontend-Polish.",
        pois: {
            "company-hq": {
                title: "Artesiana HQ",
                body: "Hier sieht man dein Business-Profil, Leistungen und wie man ein Projekt mit dir startet.",
                actions: { "company-website": "Artesiana öffnen", "company-services": "Leistungen anzeigen" }
            },
            "construction-ruins": {
                title: "Production Zone",
                body: "Dieses Haus wird später mit neuem Content repariert und freigeschaltet.",
                actions: { "ruins-soon": "Noch geschlossen" }
            },
            "github-house": {
                title: "GitHub Werkstatt",
                body: "Hier sehen Besucher deinen Code, Commit-Historie und aktive Projekte.",
                actions: { "github-open": "GitHub öffnen" }
            },
            "linkedin-house": {
                title: "LinkedIn",
                body: "Hier geht es direkt zu deinem Lebenslauf und professionellen Profil.",
                actions: { "linkedin-open": "LinkedIn öffnen" }
            },
            "projects-lab": {
                title: "Fun Projects Lab",
                body: "Hier liegen deine coolen Experimente, Side Projects und Demos.",
                actions: { "projects-list": "Projektliste anzeigen" }
            },
            "sign-about": {
                title: "About This World",
                body: "Diese Website ist deine Portfolio-Welt. Jede Location repräsentiert einen Teil deiner Arbeit.",
                actions: { "action-sign-about-coming-soon": "Coming soon" }
            },
            "sign-controls": {
                title: "Controls",
                body: "Desktop: WASD oder Pfeiltasten. Interaktion: E, Enter, Space oder Klick. Mobile: D-Pad + Interact.",
                actions: { "action-sign-controls-coming-soon": "Coming soon" }
            },
            "twitter-house": {
                title: "Twitter Kiosk",
                body: "Der Kanal wird vorbereitet. Du kannst ihn später einfach per Glossar aktivieren.",
                actions: { "twitter-open": "Twitter öffnen" }
            },
            "youtube-house": {
                title: "YouTube Studio",
                body: "Diese Location ist noch im Bau. Bald erscheinen hier Video-Formate.",
                actions: { "youtube-soon": "Coming Soon" }
            }
        }
    }
};

// Initialize Game
const k: KaboomCtx = kaboom({
    global: false,
    scale: 2, // Keep retro chunky scaling
    background: [37, 99, 235], // Ocean Blue
    canvas: document.getElementById("game-canvas") as HTMLCanvasElement,
    // By omitting width/height and letterbox, Kaboom natively fills the exact available screen 
    // space continuously without cropping or black bars.
});

// Native Kaboom event for resizing without manual projection matrix hacks
// Moved inside scene to properly handle zoom scaling on resize

async function loadAssets() {
    // Player
    k.loadSprite("player", "/assets/game/pixellab/characters/player/south.png");
    k.loadSprite("player-walk-south", "/assets/game/pixellab/characters/player/walk/south.png", { sliceX: 4, anims: { walk: { from: 0, to: 3, loop: true, speed: 8 } } });
    k.loadSprite("player-walk-north", "/assets/game/pixellab/characters/player/walk/north.png", { sliceX: 4, anims: { walk: { from: 0, to: 3, loop: true, speed: 8 } } });
    k.loadSprite("player-walk-east", "/assets/game/pixellab/characters/player/walk/east.png", { sliceX: 4, anims: { walk: { from: 0, to: 3, loop: true, speed: 8 } } });
    k.loadSprite("player-walk-west", "/assets/game/pixellab/characters/player/walk/west.png", { sliceX: 4, anims: { walk: { from: 0, to: 3, loop: true, speed: 8 } } });

    // NPCs
    k.loadSprite("guide", "/assets/game/pixellab/characters/npc/guide/south.png");
    k.loadSprite("recruiter", "/assets/game/pixellab/characters/npc/recruiter/south.png");
    k.loadSprite("villager", "/assets/game/pixellab/characters/npc/south.png");

    // Map Overlays
    k.loadSprite("mapOverlay", `/assets/game/map/map-composite.png`);

    // Objects
    for (const obj of MAP_OBJECTS) {
        k.loadSprite(obj.key, `/assets/game/map/objects/${obj.filename}`);
    }
}

k.scene("main", async () => {
    let gameStarted = false;

    // Map Background
    k.add([
        k.sprite("mapOverlay"),
        k.pos(0, 0),
        k.z(-100),
    ]);

    // Water Collisions (Performance optimized)
    // Instead of creating a body for every single tile, we use Kaboom's tile map parsing
    // or just let the boundaries handle it if water is only on the edges.
    // For now, to reduce thousands of bodies, we only create bodies for water tiles
    // if we really need them, or we group them.
    const OFFSET_X = 0;
    const OFFSET_Y = 0;

    // Prepare bridge areas to exclude water collisions under them
    const bridges = MAP_OBJECTS.filter(obj => obj.filename.includes("bridge"));
    const isUnderBridge = (col: number, row: number) => {
        const x = col * MAP_TILE_SIZE;
        const y = row * MAP_TILE_SIZE;
        const tLeft = x;
        const tRight = x + MAP_TILE_SIZE;
        const tTop = y;
        const tBottom = y + MAP_TILE_SIZE;

        for (const bridge of bridges) {
            const bLeft = bridge.x - bridge.width / 2;
            const bRight = bridge.x + bridge.width / 2;
            // Add a little padding to the bridge's hit area to allow smooth walking
            const bTop = bridge.y - bridge.height / 2 + 8;
            const bBottom = bridge.y + bridge.height / 2 - 8;

            if (tRight > bLeft && tLeft < bRight && tBottom > bTop && tTop < bBottom) {
                return true;
            }
        }
        return false;
    };
    
    // Simple greedy meshing for rows to reduce collider count drastically
    for (let r = 0; r < TERRAIN_GRID.length; r++) {
        let startCol = -1;
        for (let c = 0; c <= TERRAIN_GRID[r].length; c++) {
            const isWater = c < TERRAIN_GRID[r].length && TERRAIN_GRID[r][c] === T_WATER && !isUnderBridge(c, r);
            
            if (isWater) {
                if (startCol === -1) startCol = c;
            } else {
                if (startCol !== -1) {
                    const width = (c - startCol) * MAP_TILE_SIZE;
                    k.add([
                        k.pos(startCol * MAP_TILE_SIZE + OFFSET_X, r * MAP_TILE_SIZE + OFFSET_Y),
                        k.area({ shape: new k.Rect(k.vec2(0), width, MAP_TILE_SIZE) }),
                        k.body({ isStatic: true }),
                        "water"
                    ]);
                    startCol = -1;
                }
            }
        }
    }

    // Map Boundaries
    const mapW = TERRAIN_GRID[0].length * MAP_TILE_SIZE;
    const mapH = TERRAIN_GRID.length * MAP_TILE_SIZE;
    k.add([k.pos(-16, 0), k.area({ shape: new k.Rect(k.vec2(0), 16, mapH) }), k.body({ isStatic: true })]); // Left
    k.add([k.pos(mapW, 0), k.area({ shape: new k.Rect(k.vec2(0), 16, mapH) }), k.body({ isStatic: true })]); // Right
    k.add([k.pos(0, -16), k.area({ shape: new k.Rect(k.vec2(0), mapW, 16) }), k.body({ isStatic: true })]); // Top
    k.add([k.pos(0, mapH), k.area({ shape: new k.Rect(k.vec2(0), mapW, 16) }), k.body({ isStatic: true })]); // Bottom

    // Objects
    for (const obj of MAP_OBJECTS) {
        // Special case: force fountain to have no collision and no interaction
        const isFountain = obj.key === "objFountain";
        const hasCol = isFountain ? false : obj.collision;

        // Ensure only buildings and specific POIs are interactable. Trees, bridges, etc. become props.
        const isInteractable = obj.poiId && obj.key !== "objTwitterRuin" && obj.key !== "objYoutubeRuin" && !isFountain;

        // Create explicit hitboxes if provided (to handle large transparent sprites like the Github house), otherwise fallback to the full sprite size
        // Using offset with a center-anchored Rect shape allows precise control relative to the sprite center.
        const customHitbox = obj.hitbox ? k.area({ shape: new k.Rect(k.vec2(0), obj.hitbox.width, obj.hitbox.height), offset: k.vec2(obj.hitbox.x, obj.hitbox.y) }) : k.area();

        k.add([
            k.sprite(obj.key),
            k.pos(obj.x, obj.y),
            k.anchor("center"),
            k.z(obj.filename.includes("bridge") ? -5 : obj.y + obj.height / 2 - 8), // Bridge should always be behind player
            hasCol ? customHitbox : k.area({ shape: new k.Rect(k.vec2(0), 0, 0) }),
            hasCol ? k.body({ isStatic: true }) : null,
            // Tag determines if player can interact with space
            isInteractable ? "mapObject" : "prop",
            { id: obj.key, poiId: obj.poiId }
        ]);

        // Create POI Banners
        if (obj.poiId && isInteractable) {
            k.add([
                k.text(portfolioGlossary.find(e => e.id === obj.poiId)?.name || "", {
                    size: 6,
                    font: '"Press Start 2P", monospace',
                    align: "center"
                }),
                k.pos(obj.x, obj.y - obj.height / 2 - 4),
                k.anchor("center"),
                k.color(255, 255, 255),
                k.outline(2, k.rgb(30, 41, 59)),
                k.z(10000), // Always on top
                "poi_banner",
                { poiId: obj.poiId }
            ]);
        }
    }

    // NPCs
    const npcs = [
        { key: "guide", pos: NPC_POSITIONS.guide, id: "guide_fountain" }, // The guy at the fountain
        { key: "recruiter", pos: NPC_POSITIONS.recruiter, id: "recruiter" }, // The recruiter at the HQ
        { key: "villager", pos: NPC_POSITIONS.villageNpc, id: "villager_ruins" }, // Left ruins
        { key: "villager", pos: NPC_POSITIONS.guideNpc2, id: "villager_projects" } // Bottom right
    ];

    for (const npc of npcs) {
        k.add([
            k.sprite(npc.key),
            k.pos(npc.pos.x, npc.pos.y),
            k.anchor("center"),
            k.area({ shape: new k.Rect(k.vec2(0, 10), 12, 12) }),
            k.body({ isStatic: true }),
            k.z(npc.pos.y + 6), // Perfect top-down Y-sorting
            "npc",
            { npcId: npc.id }
        ]);
    }

    // Player
    const player = k.add([
        k.sprite("player"),
        k.pos(PLAYER_SPAWN.x, PLAYER_SPAWN.y),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(0, 10), 12, 12) }),
        k.body(),
        k.z(PLAYER_SPAWN.y + 10),
        "player"
    ]);

    const SPEED = 120;

    // Debugging / Inspection logic
    const debugPanel = document.getElementById("debug-panel");
    const dFps = document.getElementById("debug-fps");
    const dObjs = document.getElementById("debug-objs");
    const dCam = document.getElementById("debug-cam");
    const dPlayer = document.getElementById("debug-player");
    const dState = document.getElementById("debug-state");
    let isDebugVisible = false;

    k.onKeyPress("f3", () => {
        isDebugVisible = !isDebugVisible;
        if (isDebugVisible) {
            debugPanel?.classList.remove("hidden");
            k.debug.inspect = true; // Shows hitboxes visually
        } else {
            debugPanel?.classList.add("hidden");
            k.debug.inspect = false;
        }
    });

    k.loop(1, () => {
        if (isDebugVisible && debugPanel) {
            if (dFps) dFps.innerText = `${k.debug.fps()}`;
            if (dObjs) dObjs.innerText = `${k.get("*").length}`;
            if (dCam) dCam.innerText = `${Math.round(k.camPos().x)}, ${Math.round(k.camPos().y)}`;
            if (dPlayer) dPlayer.innerText = `${Math.round(player.pos.x)}, ${Math.round(player.pos.y)}`;
            
            const stateStr = isDialogActive ? "DIALOG" : (gameStarted ? "PLAYING" : "ONBOARDING");
            if (dState) dState.innerText = stateStr;
        }
    });

    // State for Map Banners
    let showBanners = true;
    const bannerBtn = document.getElementById("banner-btn");

    if (bannerBtn) {
        bannerBtn.onclick = () => {
            showBanners = !showBanners;
            bannerBtn.style.color = showBanners ? "var(--text-main)" : "var(--text-muted)";
            
            // Toggle all banner objects
            k.get("poi_banner").forEach(b => {
                b.hidden = !showBanners;
            });

            // Re-focus game
            if (gameStarted) {
                k.canvas.focus();
                window.focus();
            }
        };
    }

    // Language logic
    const langBtn = document.getElementById("lang-btn");
    const updateLanguageUI = () => {
        const tr = t[currentLang];
        // Onboarding
        const obTitle = document.querySelector(".onboarding-content h2");
        const obBody = document.querySelector(".onboarding-content p");
        const obStart = document.getElementById("start-btn");
        if (obTitle) obTitle.textContent = tr.onboardingTitle;
        if (obBody) obBody.innerHTML = tr.onboardingBody;
        if (obStart) obStart.textContent = tr.startGame;

        // Profile
        const profDesc = document.querySelector(".hud-info p");
        if (profDesc) profDesc.textContent = tr.profileDesc;

        // Toggle Button Text
        if (langBtn) langBtn.textContent = currentLang === "en" ? "DE" : "EN";

        // Update Banners Text
        k.get("poi_banner").forEach(b => {
            const entryId = b.poiId;
            if (entryId && tr.pois[entryId as keyof typeof tr.pois]) {
                const title = tr.pois[entryId as keyof typeof tr.pois].title;
                b.text = title;
            }
        });
    };

    if (langBtn) {
        langBtn.onclick = () => {
            currentLang = currentLang === "en" ? "de" : "en";
            updateLanguageUI();
            
            // Re-focus game to prevent WASD unbinding
            if (gameStarted) {
                k.canvas.focus();
                window.focus();
            }
        };
    }
    updateLanguageUI(); // Set initial text

    // Start Game logic
    const onboardingUI = document.getElementById("onboarding-ui");
    const startBtn = document.getElementById("start-btn");
    if (startBtn && onboardingUI) {
        startBtn.onclick = () => {
            onboardingUI.classList.add("hidden");
            gameStarted = true;
            // Fix: Focus canvas immediately to capture WASD input without extra click
            k.canvas.setAttribute("tabindex", "0");
            k.canvas.focus();
            window.focus();
        };
    }

    // Dialog System State
    let isDialogActive = false;
    let typeWriterRaf: number | null = null;
    let currentDialogText = "";
    const dialogUI = document.getElementById("dialog-ui");
    const dialogTitle = document.getElementById("dialog-title");
    const dialogBody = document.getElementById("dialog-body");
    const dialogActions = document.getElementById("dialog-actions");

    const dialogAvatar = document.querySelector(".dialog-avatar") as HTMLElement;

    function showDialog(title: string, body: string, actions?: { text: string, link: string }[]) {
        if (!dialogUI || !dialogTitle || !dialogBody) return;
        isDialogActive = true;
        currentDialogText = body;
        dialogTitle.textContent = title;
        dialogBody.textContent = "";

        if (dialogAvatar) {
            if (title.toLowerCase() === "sign" || title.toLowerCase().includes("schild")) {
                dialogAvatar.style.display = "none";
            } else {
                dialogAvatar.style.display = "block";
                if (title.includes("Artesiana")) {
                    dialogAvatar.style.backgroundImage = "url('/assets/pictures/artesiana-pixelimg.png')";
                } else {
                    dialogAvatar.style.backgroundImage = "url('/assets/pictures/leo-headshot.png')";
                }
            }
        }
        
        if (dialogActions) {
            dialogActions.innerHTML = "";
            dialogActions.classList.add("hidden");
        }

        dialogUI.classList.remove("hidden");

        if (typeWriterRaf) {
            cancelAnimationFrame(typeWriterRaf);
        }

        const injectButtons = () => {
            if (dialogActions && actions && actions.length > 0 && dialogActions.childElementCount === 0) {
                dialogActions.classList.remove("hidden");
                actions.forEach(action => {
                    const btn = document.createElement("button");
                    btn.className = "retro-btn";
                    btn.textContent = action.text;
                    btn.onclick = () => {
                        window.open(action.link, "_blank");
                        // Refocus game to avoid getting stuck if user clicks back to the window
                        if (gameStarted) k.canvas.focus();
                    };
                    dialogActions.appendChild(btn);
                });
                
                const cancelBtn = document.createElement("button");
                cancelBtn.className = "retro-btn";
                cancelBtn.style.background = "var(--bg-panel)";
                cancelBtn.style.color = "var(--text-main)";
                cancelBtn.textContent = t[currentLang].cancel;
                cancelBtn.onclick = () => {
                    closeDialog();
                };
                dialogActions.appendChild(cancelBtn);
            }
        };

        let index = 0;
        let lastTime = performance.now();
        const speedMs = 15; // smooth speed with rAF

        function typeWriter(time: number) {
            if (time - lastTime >= speedMs) {
                if (index < body.length) {
                    dialogBody!.textContent += body[index];
                    index++;
                    lastTime = time;
                } else {
                    typeWriterRaf = null;
                    injectButtons();
                    return;
                }
            }
            typeWriterRaf = requestAnimationFrame(typeWriter);
        }
        typeWriterRaf = requestAnimationFrame(typeWriter);
        
        // Expose inject method to global state for the fast-forward skip
        window._injectDialogButtons = injectButtons;
    }

    function closeDialog() {
        if (!dialogUI) return;
        isDialogActive = false;
        dialogUI.classList.add("hidden");
        if (typeWriterRaf) {
            cancelAnimationFrame(typeWriterRaf);
            typeWriterRaf = null;
        }
        if (dialogActions) {
            dialogActions.classList.add("hidden");
            dialogActions.innerHTML = "";
        }
        
        // Auto-refocus canvas to allow immediate WASD movement
        if (gameStarted) {
            k.canvas.focus();
        }
    }

    // Zero-allocation camera variables
    let currentZoom = window.innerWidth < 768 ? 1.8 : 3.5;
    const camScaleCache = k.vec2(currentZoom);
    const camPosCache = k.vec2(0, 0);

    // Initial camera scale
    k.camScale(camScaleCache);

    k.onResize(() => {
        // Only run responsive check on actual browser resize, not every frame
        currentZoom = window.innerWidth < 768 ? 1.8 : 3.5;
        camScaleCache.x = currentZoom;
        camScaleCache.y = currentZoom;
        k.camScale(camScaleCache);
        
        // Keeps camera in bounds correctly if viewport changes bounds significantly
        k.camPos(k.camPos()); 
    });

    // Camera follow with lerp and clamp to never show black borders
    player.onUpdate(() => {
        // Clamp boundaries
        const viewW = k.width() / currentZoom / 2;
        const viewH = k.height() / currentZoom / 2;

        let cx = player.pos.x;
        let cy = player.pos.y;

        // Only clamp if the map is bigger than the view, otherwise center the map
        if (mapW > viewW * 2) cx = Math.max(viewW, Math.min(cx, mapW - viewW));
        else cx = mapW / 2;

        if (mapH > viewH * 2) cy = Math.max(viewH, Math.min(cy, mapH - viewH));
        else cy = mapH / 2;

        // Round camera position to prevent subpixel jitter, and ONLY update Kaboom if the pixel actually changed
        const newCamX = Math.round(cx);
        const newCamY = Math.round(cy);
        
        if (camPosCache.x !== newCamX || camPosCache.y !== newCamY) {
            camPosCache.x = newCamX;
            camPosCache.y = newCamY;
            k.camPos(newCamX, newCamY);
        }
        
        player.z = player.pos.y + 10;
    });

    let currentDir = "south";
    let isMoving = false;

    // Mobile Controls State
    const mobileDir = { x: 0, y: 0 };

    const btnUp = document.getElementById("btn-up");
    const btnDown = document.getElementById("btn-down");
    const btnLeft = document.getElementById("btn-left");
    const btnRight = document.getElementById("btn-right");
    const btnA = document.getElementById("btn-a");

    const setupBtn = (btn: HTMLElement | null, dx: number, dy: number) => {
        if (!btn) return;
        btn.addEventListener("touchstart", (e) => { e.preventDefault(); mobileDir.x = dx; mobileDir.y = dy; });
        btn.addEventListener("touchend", (e) => { e.preventDefault(); mobileDir.x = 0; mobileDir.y = 0; });
        btn.addEventListener("mousedown", (e) => { e.preventDefault(); mobileDir.x = dx; mobileDir.y = dy; });
        btn.addEventListener("mouseup", (e) => { e.preventDefault(); mobileDir.x = 0; mobileDir.y = 0; });
    };

    setupBtn(btnUp, 0, -1);
    setupBtn(btnDown, 0, 1);
    setupBtn(btnLeft, -1, 0);
    setupBtn(btnRight, 1, 0);

    let recruiterTalkCount = 0;

    function triggerInteraction() {
        if (!gameStarted) return;
        if (isDialogActive) {
            if (typeWriterRaf) {
                // Complete text instantly
                cancelAnimationFrame(typeWriterRaf);
                typeWriterRaf = null;
                if (dialogBody) dialogBody.textContent = currentDialogText;
                
                // Show actions instantly if they exist, otherwise the user can close the dialog next click
                if (window._injectDialogButtons) {
                    window._injectDialogButtons();
                }
            } else {
                // Only close the dialog if it's NOT displaying active buttons, to prevent accidentally skipping the choice
                if (!dialogActions || dialogActions.childElementCount === 0 || dialogActions.classList.contains("hidden")) {
                     closeDialog();
                }
            }
            return;
        }

        type InteractableObj = GameObj & {
            poiId?: string;
            npcId?: string;
            pos: typeof player.pos;
            is: (tag: string) => boolean;
        };

        // Find closest interactable object without allocating new arrays
        let closestObj: InteractableObj | null = null;
        let closestDist = Infinity;

        for (const obj of k.get("mapObject")) {
            const mapObj = obj as InteractableObj;
            if (!mapObj.pos) continue;
            const dist = player.pos.dist(mapObj.pos);
            const entry = mapObj.poiId ? portfolioGlossary.find((e) => e.id === mapObj.poiId) : null;
            const interactionRange = entry?.world?.interactRadius || 80;

            if (dist <= interactionRange && dist < closestDist) {
                closestDist = dist;
                closestObj = mapObj;
            }
        }
        
        for (const obj of k.get("npc")) {
            const npcObj = obj as InteractableObj;
            if (!npcObj.pos) continue;
            const dist = player.pos.dist(npcObj.pos);
            const interactionRange = 60; // NPCs are smaller and easier to reach

            if (dist <= interactionRange && dist < closestDist) {
                closestDist = dist;
                closestObj = npcObj;
            }
        }

        if (closestObj) {
            const target = closestObj;
            const tr = t[currentLang];
            // Determine what to say based on POI or NPC data
            let title = target.is("npc") ? tr.npcVillagerTitle : "Sign";
            let text = "Hello there!";
            const actions: {text: string, link: string}[] = [];

            if (target.poiId) {
                const entry = portfolioGlossary.find(e => e.id === target.poiId);
                const translatedEntry = tr.pois[target.poiId as keyof typeof tr.pois];
                
                if (entry && translatedEntry) {
                    title = translatedEntry.title;
                    text = translatedEntry.body;
                    
                    if (entry.actions) {
                        for (const action of entry.actions) {
                            if (action.type === 'open_link' && typeof action.href === "string") {
                                // Find translation for action label based on action id, default to translated action mapping
                                const label = translatedEntry.actions[action.id as keyof typeof translatedEntry.actions] || action.label;
                                actions.push({ text: label, link: action.href });
                            }
                        }
                    }
                } else if (entry && entry.dialog) {
                    // Fallback to original
                    title = entry.dialog.title;
                    text = entry.dialog.body;
                    if (entry.actions) {
                        for (const action of entry.actions) {
                            if (action.type === 'open_link' && typeof action.href === "string") {
                                actions.push({ text: action.label, link: action.href });
                            }
                        }
                    }
                }
            } else if (target.is("npc")) {
                if (target.npcId === "guide_fountain") {
                    title = tr.npcGuideTitle;
                    text = tr.npcGuideText;
                } else if (target.npcId === "villager_ruins") {
                    title = tr.npcVillagerTitle;
                    text = tr.npcVillagerText;
                } else if (target.npcId === "villager_projects") {
                    title = tr.npcProjectsTitle;
                    text = tr.npcProjectsText;
                } else if (target.npcId === "recruiter") {
                    title = tr.npcRecruiterTitle;
                    recruiterTalkCount++;
                    if (recruiterTalkCount === 3) {
                        text = tr.npcRecruiterEasterEgg;
                        for (let i = 0; i < 50; i++) {
                            k.add([
                                k.rect(4, 4),
                                k.pos(target.pos.x, target.pos.y),
                                k.color(k.rand(0, 255), k.rand(0, 255), k.rand(0, 255)),
                                k.move(k.choose([k.LEFT, k.RIGHT, k.UP, k.DOWN]), k.rand(20, 60)),
                                k.lifespan(1, { fade: 0.5 }),
                            ]);
                        }
                        recruiterTalkCount = 0;
                    } else {
                        text = tr.npcRecruiterText;
                    }
                }
            }

            showDialog(title, text, actions);
        }
    }

    if (btnA) {
        btnA.addEventListener("mousedown", (e) => { e.preventDefault(); triggerInteraction(); });
        btnA.addEventListener("touchstart", (e) => { e.preventDefault(); triggerInteraction(); });
    }

    // Movement Logic
    k.onUpdate(() => {
        if (!gameStarted || isDialogActive) {
            if (isMoving) {
                if (currentDir === "south") player.use(k.sprite("player"));
                player.stop();
                isMoving = false;
            }
            return;
        }

        let mx = 0;
        let my = 0;
        if (k.isKeyDown("w") || k.isKeyDown("up") || mobileDir.y < 0) my -= 1;
        if (k.isKeyDown("s") || k.isKeyDown("down") || mobileDir.y > 0) my += 1;
        if (k.isKeyDown("a") || k.isKeyDown("left") || mobileDir.x < 0) mx -= 1;
        if (k.isKeyDown("d") || k.isKeyDown("right") || mobileDir.x > 0) mx += 1;

        if (mx !== 0 || my !== 0) {
            // zero allocation math
            const len = Math.sqrt(mx * mx + my * my);
            const vx = (mx / len) * SPEED;
            const vy = (my / len) * SPEED;
            
            // move uses physics and DT internally
            player.move(vx, vy);

            // Determine animation direction string
            let newDir = currentDir;
            if (mx > 0) newDir = "east";
            else if (mx < 0) newDir = "west";
            else if (my < 0) newDir = "north";
            else if (my > 0) newDir = "south";

            if (!isMoving || newDir !== currentDir) {
                player.use(k.sprite(`player-walk-${newDir}`));
                player.play("walk");
                currentDir = newDir;
                isMoving = true;
            }
        } else {
            if (isMoving) {
                // Stop moving, revert to idle sprite
                if (currentDir === "south") player.use(k.sprite("player"));
                player.stop();
                isMoving = false;
            }
        }
    });

    // Interaction Action (Space bar or Enter)
    for (const key of ["space", "enter"]) {
        k.onKeyPress(key as Key, triggerInteraction);
    }

});

loadAssets().then(() => {
    k.go("main");
});

// Fix memory leaks and GC crashes caused by Vite HMR stacking multiple game loops
if (import.meta.hot) {
    import.meta.hot.on("vite:beforeUpdate", () => {
        window.location.reload();
    });
}
