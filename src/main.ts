import kaboom from "kaboom";
import type { EventController, GameObj, KaboomCtx, Key } from "kaboom";
import { MAP_OBJECTS, PLAYER_SPAWN, NPC_POSITIONS, TERRAIN_GRID, T_WATER, MAP_TILE_SIZE } from "./game/world/mapData";
import { portfolioById, npcGlossary, npcById, recruiterEasterEgg, projects } from "./content/glossary";
import { birthdayConfig, birthdayGifts } from "./content/birthday";
import type { Lang, LocalizedText, PoiAction } from "./content/types";

const LANG_STORAGE_KEY = "lang";

function readStorage(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Private mode or blocked storage: the feature simply doesn't persist.
    }
}

function detectInitialLang(): Lang {
    const stored = readStorage(LANG_STORAGE_KEY);
    if (stored === "en" || stored === "de") return stored;
    return navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
}

let currentLang: Lang = detectInitialLang();

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const DEFAULT_DIALOG_AVATAR = "/assets/pictures/leo-headshot.png";

const DIALOG_AVATAR_BY_POI_ID: Record<string, string> = {
    "company-hq": "/assets/pictures/artesiana-pixelimg.png",
};

// UI chrome only. All POI/NPC copy lives in src/content/.
const t = {
    en: {
        onboardingTitle: "Welcome to Leo's World",
        onboardingBody: "Use WASD, arrows, or the on-screen D-pad to move.<br>Press E, Enter, or SPACE near buildings and people.",
        startGame: "Start Game",
        profileDesc: "Developer & Creator",
        cancel: "Cancel",
    },
    de: {
        onboardingTitle: "Willkommen in Leos Welt",
        onboardingBody: "Nutze WASD, Pfeiltasten oder das D-Pad, um dich zu bewegen.<br>Drücke E, Enter oder SPACE bei Gebäuden und Personen.",
        startGame: "Spiel starten",
        profileDesc: "Entwickler & Creator",
        cancel: "Abbrechen",
    },
};

function tr(text: LocalizedText): string {
    return text[currentLang];
}

// Initialize Game
const k: KaboomCtx = kaboom({
    global: false,
    scale: 2, // Keep retro chunky scaling
    background: [37, 99, 235], // Ocean Blue
    canvas: document.getElementById("game-canvas") as HTMLCanvasElement,
    // By omitting width/height and letterbox, Kaboom natively fills the exact available screen
    // space continuously without cropping or black bars.
});
k.setGravity(0);

function openExternalLinkSafely(link: string): void {
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(link, window.location.href);
    } catch {
        return;
    }

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        return;
    }

    window.open(parsedUrl.toString(), "_blank", "noopener,noreferrer");
}

function getDialogAvatar(options: { poiId?: string; npcId?: string }): string | null {
    if (options.npcId) {
        return npcById.get(options.npcId)?.avatar ?? DEFAULT_DIALOG_AVATAR;
    }

    if (options.poiId) {
        const entry = portfolioById.get(options.poiId);
        if (entry?.world.visual === "sign") {
            return null;
        }

        return DIALOG_AVATAR_BY_POI_ID[options.poiId] ?? DEFAULT_DIALOG_AVATAR;
    }

    return DEFAULT_DIALOG_AVATAR;
}

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
    k.loadSprite("villager-east", "/assets/game/pixellab/characters/npc/east.png");
    k.loadSprite("cuteGirl", "/assets/game/pixellab/characters/npc/cute_girl.png");

    // Map Overlays
    k.loadSprite("mapOverlay", `/assets/game/map/map-composite.png`);

    // Objects
    for (const obj of MAP_OBJECTS) {
        k.loadSprite(obj.key, `/assets/game/map/objects/${obj.filename}`);
    }
}

k.scene("main", async () => {
    let gameStarted = false;
    const poiById = portfolioById;
    const domCleanup: Array<() => void> = [];
    const kaboomCleanup: EventController[] = [];
    const addDomListener = (
        target: Window | Document | HTMLElement,
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ) => {
        target.addEventListener(type, listener, options);
        domCleanup.push(() => target.removeEventListener(type, listener, options));
    };
    const trackKaboom = (controller: EventController | void) => {
        if (controller) {
            kaboomCleanup.push(controller);
        }
    };

    // Map Background
    k.add([
        k.sprite("mapOverlay"),
        k.pos(0, 0),
        k.z(-100),
    ]);

    // Water Collisions (Performance optimized)
    // Instead of creating a body for every single tile, greedy meshing merges
    // horizontal runs of water tiles into single static bodies.
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
        const isInteractable = !!obj.poiId && !isFountain;

        // Create explicit hitboxes if provided (to handle large transparent sprites like the Github house), otherwise fallback to the full sprite size
        // Using offset with a center-anchored Rect shape allows precise control relative to the sprite center.
        const customHitbox = obj.hitbox ? k.area({ shape: new k.Rect(k.vec2(0), obj.hitbox.width, obj.hitbox.height), offset: k.vec2(obj.hitbox.x, obj.hitbox.y) }) : k.area();
        const hitboxBottomY = obj.hitbox ? (obj.hitbox.y + obj.hitbox.height / 2) : (obj.height / 2 - 4);

        k.add([
            k.sprite(obj.key),
            k.pos(obj.x, obj.y),
            k.anchor("center"),
            k.z(obj.filename.includes("bridge") ? -5 : obj.y + hitboxBottomY), // Bridge should always be behind player
            hasCol ? customHitbox : k.area({ shape: new k.Rect(k.vec2(0), 0, 0) }),
            hasCol ? k.body({ isStatic: true }) : null,
            // Tag determines if player can interact with space
            isInteractable ? "mapObject" : "prop",
            { id: obj.key, poiId: obj.poiId }
        ]);

        // Create POI Banners
        if (obj.poiId && isInteractable) {
            const entry = poiById.get(obj.poiId);
            k.add([
                k.text(entry ? tr(entry.dialog.title) : "", {
                    size: 6,
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

    // NPCs. Copy, avatars, sprites, and spawn points live in npcGlossary.
    for (const npc of npcGlossary) {
        const pos = NPC_POSITIONS[npc.positionKey as keyof typeof NPC_POSITIONS];
        if (!pos) continue;
        k.add([
            k.sprite(npc.spriteKey),
            k.pos(pos.x, pos.y),
            k.anchor("center"),
            k.area({ shape: new k.Rect(k.vec2(0, 10), 12, 12) }),
            k.body({ isStatic: true }),
            k.z(pos.y + 16), // Perfect top-down Y-sorting matching physics hitbox bottom
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
        k.z(PLAYER_SPAWN.y + 16),
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

    trackKaboom(k.onKeyPress("f3", () => {
        isDebugVisible = !isDebugVisible;
        if (isDebugVisible) {
            debugPanel?.classList.remove("hidden");
            k.debug.inspect = true; // Shows hitboxes visually
        } else {
            debugPanel?.classList.add("hidden");
            k.debug.inspect = false;
        }
    }));

    trackKaboom(k.loop(1, () => {
        if (isDebugVisible && debugPanel) {
            if (dFps) dFps.innerText = `${k.debug.fps()}`;
            if (dObjs) dObjs.innerText = `${k.get("*").length}`;
            if (dCam) dCam.innerText = `${Math.round(k.camPos().x)}, ${Math.round(k.camPos().y)}`;
            if (dPlayer) dPlayer.innerText = `${Math.round(player.pos.x)}, ${Math.round(player.pos.y)}`;

            const stateStr = isDialogActive ? "DIALOG" : (isOverlayActive ? "OVERLAY" : (gameStarted ? "PLAYING" : "ONBOARDING"));
            if (dState) dState.innerText = stateStr;
        }
    }));

    // State for Map Banners
    let showBanners = true;
    const bannerBtn = document.getElementById("banner-btn");

    if (bannerBtn) {
        addDomListener(bannerBtn, "click", () => {
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
        });
    }

    // Language logic
    const langBtn = document.getElementById("lang-btn");
    const updateLanguageUI = () => {
        const chrome = t[currentLang];
        document.documentElement.lang = currentLang;

        // Onboarding
        const obTitle = document.querySelector(".onboarding-content h2");
        const obBody = document.querySelector(".onboarding-content p");
        const obStart = document.getElementById("start-btn");
        if (obTitle) obTitle.textContent = chrome.onboardingTitle;
        if (obBody) obBody.innerHTML = chrome.onboardingBody;
        if (obStart) obStart.textContent = chrome.startGame;

        // Profile
        const profDesc = document.querySelector(".hud-info p");
        if (profDesc) profDesc.textContent = chrome.profileDesc;

        // Toggle Button Text
        if (langBtn) langBtn.textContent = currentLang === "en" ? "DE" : "EN";

        // Update Banners Text
        k.get("poi_banner").forEach(b => {
            const entry = b.poiId ? poiById.get(b.poiId) : null;
            if (entry) {
                b.text = tr(entry.dialog.title);
            }
        });
    };

    if (langBtn) {
        addDomListener(langBtn, "click", () => {
            currentLang = currentLang === "en" ? "de" : "en";
            writeStorage(LANG_STORAGE_KEY, currentLang);
            updateLanguageUI();

            // Re-focus game to prevent WASD unbinding
            if (gameStarted) {
                k.canvas.focus();
                window.focus();
            }
        });
    }
    updateLanguageUI(); // Set initial text

    // Start Game logic
    const onboardingUI = document.getElementById("onboarding-ui");
    const startBtn = document.getElementById("start-btn");
    if (startBtn && onboardingUI) {
        addDomListener(startBtn, "click", () => {
            onboardingUI.classList.add("hidden");
            gameStarted = true;
            // Fix: Focus canvas immediately to capture WASD input without extra click
            k.canvas.setAttribute("tabindex", "0");
            k.canvas.focus();
            window.focus();
        });
    }

    // Dialog System State
    let isDialogActive = false;
    let isOverlayActive = false;
    let typeWriterRaf: number | null = null;
    let currentDialogText = "";
    let pendingInjectButtons: (() => void) | null = null;
    const dialogUI = document.getElementById("dialog-ui");
    const dialogTitle = document.getElementById("dialog-title");
    const dialogBody = document.getElementById("dialog-body");
    const dialogActions = document.getElementById("dialog-actions");
    const dialogLive = document.getElementById("dialog-live");

    const dialogAvatar = document.querySelector(".dialog-avatar") as HTMLElement;

    type DialogButton = {
        text: string;
        onSelect?: () => void;
        disabled?: boolean;
        secondary?: boolean;
    };

    function makeDialogButton(config: DialogButton): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.className = "retro-btn";
        btn.textContent = config.text;
        if (config.disabled) {
            btn.disabled = true;
            btn.classList.add("retro-btn-disabled");
        }
        if (config.secondary) {
            btn.classList.add("retro-btn-secondary");
        }
        if (config.onSelect) {
            btn.onclick = config.onSelect;
        }
        return btn;
    }

    function showDialog(
        title: string,
        body: string,
        buttons?: DialogButton[],
        avatarImage?: string | null,
        buildExtraActions?: (container: HTMLElement) => void,
    ) {
        if (!dialogUI || !dialogTitle || !dialogBody) return;
        isDialogActive = true;
        currentDialogText = body;
        dialogTitle.textContent = title;
        dialogBody.textContent = "";
        // Announce the full text right away for assistive tech; the typewriter
        // below is purely visual.
        if (dialogLive) dialogLive.textContent = `${title}. ${body}`;

        if (dialogAvatar) {
            if (!avatarImage) {
                dialogAvatar.style.display = "none";
            } else {
                dialogAvatar.style.display = "block";
                dialogAvatar.style.backgroundImage = `url('${avatarImage}')`;
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

        const hasActions = (buttons && buttons.length > 0) || !!buildExtraActions;
        const injectButtons = () => {
            if (!dialogActions || !hasActions || dialogActions.childElementCount > 0) return;
            dialogActions.classList.remove("hidden");
            if (buttons) {
                for (const button of buttons) {
                    dialogActions.appendChild(makeDialogButton(button));
                }
            }
            if (buildExtraActions) {
                buildExtraActions(dialogActions);
            }
            dialogActions.appendChild(makeDialogButton({
                text: t[currentLang].cancel,
                secondary: true,
                onSelect: () => closeDialog(),
            }));
        };
        pendingInjectButtons = injectButtons;

        if (prefersReducedMotion) {
            dialogBody.textContent = body;
            typeWriterRaf = null;
            injectButtons();
            return;
        }

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
    }

    function closeDialog() {
        if (!dialogUI) return;
        isDialogActive = false;
        dialogUI.classList.add("hidden");
        currentDialogText = "";
        if (typeWriterRaf) {
            cancelAnimationFrame(typeWriterRaf);
            typeWriterRaf = null;
        }
        if (dialogBody) {
            dialogBody.textContent = "";
        }
        if (dialogLive) {
            dialogLive.textContent = "";
        }
        if (dialogActions) {
            dialogActions.classList.add("hidden");
            dialogActions.innerHTML = "";
        }
        pendingInjectButtons = null;

        // Auto-refocus canvas to allow immediate WASD movement
        if (gameStarted && !isOverlayActive) {
            k.canvas.focus();
        }
    }

    // ---------------------------------------------------------------------
    // Overlays (Projects Lab, Birthday)
    // ---------------------------------------------------------------------

    const projectsOverlay = document.getElementById("projects-overlay");
    const projectsList = document.getElementById("projects-list");
    const projectsTitle = document.getElementById("projects-title");
    const projectsCloseBtn = document.getElementById("projects-close");

    const birthdayOverlay = document.getElementById("birthday-overlay");
    const birthdayTitle = document.getElementById("birthday-title");
    const birthdayIntro = document.getElementById("birthday-intro");
    const birthdayGiftsEl = document.getElementById("birthday-gifts");
    const birthdayOutro = document.getElementById("birthday-outro");
    const birthdaySignature = document.getElementById("birthday-signature");
    const birthdayHearts = document.getElementById("birthday-hearts");
    const birthdayCloseBtn = document.getElementById("birthday-close");

    // While an overlay is open, keep keyboard focus inside it: the game UI
    // behind it becomes inert (unfocusable, unclickable, hidden from AT).
    const setBackgroundInert = (on: boolean) => {
        for (const id of ["game-container", "hud-ui", "mobile-controls", "dialog-ui", "debug-panel", "onboarding-ui", "seo-header"]) {
            document.getElementById(id)?.toggleAttribute("inert", on);
        }
    };

    function openOverlay(overlay: HTMLElement | null, focusTarget: HTMLElement | null) {
        if (!overlay) return;
        closeDialog();
        isOverlayActive = true;
        overlay.classList.remove("hidden");
        setBackgroundInert(true);
        // preventScroll: focusing the close button at the bottom must not
        // scroll the freshly opened window past its header.
        focusTarget?.focus({ preventScroll: true });
        overlay.querySelector(".overlay-window")?.scrollTo(0, 0);
    }

    function closeOverlay(overlay: HTMLElement | null) {
        if (!overlay) return;
        overlay.classList.add("hidden");
        isOverlayActive = false;
        setBackgroundInert(false);
        if (gameStarted) {
            k.canvas.focus();
        }
    }

    function openProjectsOverlay() {
        if (!projectsOverlay || !projectsList) return;
        if (projectsTitle) {
            const entry = poiById.get("projects-lab");
            projectsTitle.textContent = entry ? tr(entry.dialog.title) : "Projects";
        }
        projectsList.innerHTML = "";
        for (const project of projects) {
            const card = document.createElement("article");
            card.className = "overlay-card";

            const heading = document.createElement("h3");
            heading.textContent = tr(project.title);
            card.appendChild(heading);

            const body = document.createElement("p");
            body.textContent = tr(project.description);
            card.appendChild(body);

            if (project.href && project.linkLabel) {
                const href = project.href;
                card.appendChild(makeDialogButton({
                    text: tr(project.linkLabel),
                    onSelect: () => openExternalLinkSafely(href),
                }));
            }
            projectsList.appendChild(card);
        }
        if (projectsCloseBtn) projectsCloseBtn.textContent = t[currentLang].cancel;
        openOverlay(projectsOverlay, projectsCloseBtn);
    }

    function spawnBirthdayHearts() {
        if (!birthdayHearts || prefersReducedMotion) return;
        birthdayHearts.innerHTML = "";
        const symbols = ["♥", "✦", "♥"];
        for (let i = 0; i < 14; i++) {
            const heart = document.createElement("span");
            heart.className = "floating-heart";
            heart.textContent = symbols[i % symbols.length];
            heart.style.left = `${Math.round(Math.random() * 96)}%`;
            heart.style.animationDelay = `${(Math.random() * 4).toFixed(2)}s`;
            heart.style.animationDuration = `${(5 + Math.random() * 4).toFixed(2)}s`;
            heart.style.fontSize = `${12 + Math.round(Math.random() * 14)}px`;
            birthdayHearts.appendChild(heart);
        }
    }

    function openBirthdayOverlay() {
        if (!birthdayOverlay || !birthdayGiftsEl) return;
        if (birthdayTitle) birthdayTitle.textContent = tr(birthdayConfig.title);
        if (birthdayIntro) birthdayIntro.textContent = tr(birthdayConfig.intro);
        if (birthdayOutro) birthdayOutro.textContent = tr(birthdayConfig.outro);
        if (birthdaySignature) birthdaySignature.textContent = tr(birthdayConfig.signature);
        if (birthdayCloseBtn) birthdayCloseBtn.textContent = tr(birthdayConfig.closeLabel);

        birthdayGiftsEl.innerHTML = "";
        for (const gift of birthdayGifts) {
            const card = document.createElement("article");
            card.className = "overlay-card gift-card";

            const img = document.createElement("img");
            img.src = gift.image;
            img.alt = gift.imageAlt;
            img.className = "gift-image";
            img.loading = "lazy";
            card.appendChild(img);

            const heading = document.createElement("h3");
            heading.textContent = tr(gift.title);
            card.appendChild(heading);

            const body = document.createElement("p");
            body.textContent = tr(gift.body);
            card.appendChild(body);

            if (gift.href && gift.linkLabel) {
                const href = gift.href;
                card.appendChild(makeDialogButton({
                    text: tr(gift.linkLabel),
                    onSelect: () => openExternalLinkSafely(href),
                }));
            }

            birthdayGiftsEl.appendChild(card);
        }

        spawnBirthdayHearts();
        openOverlay(birthdayOverlay, birthdayCloseBtn);
    }

    if (projectsCloseBtn) {
        addDomListener(projectsCloseBtn, "click", () => closeOverlay(projectsOverlay));
    }
    if (birthdayCloseBtn) {
        addDomListener(birthdayCloseBtn, "click", () => closeOverlay(birthdayOverlay));
    }
    addDomListener(window, "keydown", (e: Event) => {
        if ((e as KeyboardEvent).key !== "Escape") return;
        if (isOverlayActive) {
            closeOverlay(projectsOverlay?.classList.contains("hidden") ? birthdayOverlay : projectsOverlay);
        } else if (isDialogActive) {
            closeDialog();
        }
    });

    const isBirthdayUnlocked = () => readStorage(birthdayConfig.storageKey) === "1";

    function buildBirthdayGate(container: HTMLElement) {
        const row = document.createElement("div");
        row.className = "gate-row";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "retro-input";
        input.placeholder = tr(birthdayConfig.inputPlaceholder);
        input.autocomplete = "off";
        input.autocapitalize = "none";
        input.spellcheck = false;
        input.setAttribute("aria-label", tr(birthdayConfig.inputPlaceholder));
        input.maxLength = 40;

        const submit = () => {
            const guess = input.value.trim().toLowerCase();
            if (guess.length === 0) return;
            if (guess === birthdayConfig.secretWord) {
                writeStorage(birthdayConfig.storageKey, "1");
                openBirthdayOverlay();
            } else {
                if (dialogBody) dialogBody.textContent = tr(birthdayConfig.wrongCode);
                if (dialogLive) dialogLive.textContent = tr(birthdayConfig.wrongCode);
                input.value = "";
                input.classList.remove("shake");
                // Force a reflow so the shake animation restarts on repeat mistakes.
                void input.offsetWidth;
                input.classList.add("shake");
                input.focus();
            }
        };

        addDomListener(input, "keydown", (e: Event) => {
            const key = (e as KeyboardEvent).key;
            if (key === "Escape") {
                // Let it bubble to the window handler that closes the dialog.
                return;
            }
            e.stopPropagation();
            if (key === "Enter") {
                e.preventDefault();
                submit();
            }
        });

        const submitBtn = makeDialogButton({
            text: tr(birthdayConfig.submitLabel),
            onSelect: submit,
        });

        row.appendChild(input);
        row.appendChild(submitBtn);
        container.appendChild(row);
    }

    // Support revisiting the present via leonaderi.com/#alma once unlocked.
    if (window.location.hash === "#alma" && isBirthdayUnlocked()) {
        openBirthdayOverlay();
    }

    // Zero-allocation camera variables
    let baseZoom = window.innerWidth < 768 ? 1.8 : 3.5;
    let currentZoom = baseZoom;
    const camScaleCache = k.vec2(currentZoom);
    const camPosCache = k.vec2(0, 0);

    // Initial camera scale
    k.camScale(camScaleCache);

    const syncCameraScale = () => {
        // Only update base zoom, maintain relative scale if user zoomed
        const newBaseZoom = window.innerWidth < 768 ? 1.8 : 3.5;
        if (baseZoom !== newBaseZoom) {
             const ratio = currentZoom / baseZoom;
             baseZoom = newBaseZoom;
             currentZoom = baseZoom * ratio;
             camScaleCache.x = currentZoom;
             camScaleCache.y = currentZoom;
             k.camScale(camScaleCache);
             k.camPos(k.camPos());
        }
    };
    addDomListener(window, "resize", syncCameraScale);

    // Zoom Controls
    const btnZoomIn = document.getElementById("btn-zoom-in");
    const btnZoomOut = document.getElementById("btn-zoom-out");

    if (btnZoomIn) {
        addDomListener(btnZoomIn, "click", () => {
            currentZoom = Math.min(currentZoom * 1.2, 6.0); // Max zoom
            camScaleCache.x = currentZoom;
            camScaleCache.y = currentZoom;
            k.camScale(camScaleCache);
            k.camPos(k.camPos()); // Re-clamp position
        });
    }

    if (btnZoomOut) {
        addDomListener(btnZoomOut, "click", () => {
            currentZoom = Math.max(currentZoom / 1.2, window.innerWidth < 768 ? 1.0 : 1.5); // Min zoom
            camScaleCache.x = currentZoom;
            camScaleCache.y = currentZoom;
            k.camScale(camScaleCache);
            k.camPos(k.camPos()); // Re-clamp position
        });
    }

    // Camera follow with lerp and clamp to never show black borders
    trackKaboom(player.onUpdate(() => {
        // Dynamic Y-sorting for the player, matching the +16 used for NPCs
        // (bottom edge of the physics hitbox).
        player.z = player.pos.y + 16;

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
    }));

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
        btn.style.touchAction = "none";
        addDomListener(btn, "touchstart", (e: Event) => { e.preventDefault(); mobileDir.x = dx; mobileDir.y = dy; }, { passive: false });
        addDomListener(btn, "touchend", (e: Event) => { e.preventDefault(); mobileDir.x = 0; mobileDir.y = 0; }, { passive: false });
        addDomListener(btn, "touchcancel", (e: Event) => { e.preventDefault(); mobileDir.x = 0; mobileDir.y = 0; }, { passive: false });
        addDomListener(btn, "mousedown", (e: Event) => { e.preventDefault(); mobileDir.x = dx; mobileDir.y = dy; });
        addDomListener(btn, "mouseup", (e: Event) => { e.preventDefault(); mobileDir.x = 0; mobileDir.y = 0; });
        addDomListener(btn, "mouseleave", () => { mobileDir.x = 0; mobileDir.y = 0; });
    };

    setupBtn(btnUp, 0, -1);
    setupBtn(btnDown, 0, 1);
    setupBtn(btnLeft, -1, 0);
    setupBtn(btnRight, 1, 0);
    k.canvas.style.touchAction = "none";

    const setIdleSprite = () => {
        if (!isMoving) return;
        if (currentDir === "south") {
            player.use(k.sprite("player"));
        } else {
            player.use(k.sprite(`player-walk-${currentDir}`));
        }
        player.frame = 0;
        player.stop();
        isMoving = false;
    };

    const resetMovement = () => {
        mobileDir.x = 0;
        mobileDir.y = 0;
        setIdleSprite();
    };

    addDomListener(window, "blur", resetMovement);
    addDomListener(window, "pointerup", () => {
        mobileDir.x = 0;
        mobileDir.y = 0;
    });
    addDomListener(document, "visibilitychange", () => {
        if (document.hidden) {
            resetMovement();
            return;
        }
        if (gameStarted && !isDialogActive && !isOverlayActive) {
            k.canvas.focus();
        }
    });

    let recruiterTalkCount = 0;

    function spawnConfetti(x: number, y: number) {
        if (prefersReducedMotion) return;
        for (let i = 0; i < 50; i++) {
            k.add([
                k.rect(4, 4),
                k.pos(x, y),
                k.color(k.rand(0, 255), k.rand(0, 255), k.rand(0, 255)),
                k.move(k.choose([k.LEFT, k.RIGHT, k.UP, k.DOWN]), k.rand(20, 60)),
                k.lifespan(1, { fade: 0.5 }),
            ]);
        }
    }

    function poiActionButtons(actions: PoiAction[]): DialogButton[] {
        const buttons: DialogButton[] = [];
        for (const action of actions) {
            if (action.type === "open_link" && typeof action.href === "string") {
                const href = action.href;
                buttons.push({
                    text: tr(action.label),
                    onSelect: () => {
                        openExternalLinkSafely(href);
                        // Refocus game to avoid getting stuck if user clicks back to the window
                        if (gameStarted) k.canvas.focus();
                    },
                });
            } else if (action.type === "open_modal" && action.modalId === "projects") {
                buttons.push({
                    text: tr(action.label),
                    onSelect: () => openProjectsOverlay(),
                });
            } else if (action.type === "coming_soon") {
                buttons.push({ text: tr(action.label), disabled: true });
            }
        }
        return buttons;
    }

    function triggerInteraction() {
        if (!gameStarted || isOverlayActive) return;
        if (isDialogActive) {
            if (typeWriterRaf) {
                // Complete text instantly
                cancelAnimationFrame(typeWriterRaf);
                typeWriterRaf = null;
                if (dialogBody) dialogBody.textContent = currentDialogText;

                // Show actions instantly if they exist, otherwise the user can close the dialog next click
                if (pendingInjectButtons) {
                    pendingInjectButtons();
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
            const entry = mapObj.poiId ? poiById.get(mapObj.poiId) : null;
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

        if (!closestObj) return;
        const target = closestObj;
        const avatar = getDialogAvatar({ poiId: target.poiId, npcId: target.npcId });

        if (target.poiId) {
            const entry = poiById.get(target.poiId);
            if (!entry) return;
            showDialog(
                tr(entry.dialog.title),
                tr(entry.dialog.body),
                poiActionButtons(entry.actions),
                avatar,
            );
            return;
        }

        if (target.is("npc") && target.npcId) {
            const npc = npcById.get(target.npcId);
            if (!npc) return;

            let text = tr(npc.dialog);
            let buildExtra: ((container: HTMLElement) => void) | undefined;
            const buttons: DialogButton[] = [];

            if (npc.special === "recruiter_easteregg") {
                recruiterTalkCount++;
                if (recruiterTalkCount === 3) {
                    text = tr(recruiterEasterEgg);
                    spawnConfetti(target.pos.x, target.pos.y);
                    recruiterTalkCount = 0;
                }
            } else if (npc.special === "birthday_gate") {
                if (isBirthdayUnlocked()) {
                    text = tr(birthdayConfig.unlockedHint);
                    buttons.push({
                        text: tr(birthdayConfig.openAgainLabel),
                        onSelect: () => openBirthdayOverlay(),
                    });
                } else {
                    buildExtra = buildBirthdayGate;
                }
            }

            showDialog(tr(npc.name), text, buttons, avatar, buildExtra);
        }
    }

    if (btnA) {
        addDomListener(btnA, "mousedown", (e: Event) => { e.preventDefault(); triggerInteraction(); });
        addDomListener(btnA, "touchstart", (e: Event) => { e.preventDefault(); triggerInteraction(); }, { passive: false });
    }

    // Movement Logic
    trackKaboom(k.onUpdate(() => {
        if (!gameStarted || isDialogActive || isOverlayActive) {
            setIdleSprite();
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
            setIdleSprite();
        }
    }));

    // Interaction Action (Space bar or Enter)
    for (const key of ["space", "enter", "e"]) {
        trackKaboom(k.onKeyPress(key as Key, triggerInteraction));
    }
    trackKaboom(k.onMousePress("left", triggerInteraction));

    k.onSceneLeave(() => {
        for (const controller of kaboomCleanup) {
            controller.cancel();
        }
        kaboomCleanup.length = 0;
        for (const cleanup of domCleanup) cleanup();
        domCleanup.length = 0;
        if (typeWriterRaf) {
            cancelAnimationFrame(typeWriterRaf);
            typeWriterRaf = null;
        }
        currentDialogText = "";
        pendingInjectButtons = null;
    });

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
