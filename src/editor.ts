import type { KaboomCtx, GameObj } from "kaboom";
import { portfolioGlossary } from "./content/glossary";
import type { PoiEntry } from "./content/types";

type MapObjectWithPoi = GameObj & {
    id: string;
    poiId?: string;
    area?: {
        shape?: {
            bbox: () => {
                p1: { x: number; y: number };
                p2: { x: number; y: number };
            };
        };
    };
};

export function setupEditorUI(k: KaboomCtx) {
    const editorUI = document.getElementById("editor-ui");
    const inspector = document.getElementById("inspector");
    const saveBtn = document.getElementById("save-btn");

    const nameInput = document.getElementById("prop-name") as HTMLInputElement;
    const hrefInput = document.getElementById("prop-href") as HTMLInputElement;
    const descInput = document.getElementById("prop-desc") as HTMLTextAreaElement;

    // Hitbox inputs
    const hxInput = document.getElementById("prop-hx") as HTMLInputElement;
    const hyInput = document.getElementById("prop-hy") as HTMLInputElement;
    const hwInput = document.getElementById("prop-hw") as HTMLInputElement;
    const hhInput = document.getElementById("prop-hh") as HTMLInputElement;

    let isEditorOpen = false;
    let selectedObj: MapObjectWithPoi | null = null;
    let selectedPoi: PoiEntry | null = null;

    k.onKeyPress("e", () => {
        isEditorOpen = !isEditorOpen;
        if (isEditorOpen) {
            editorUI?.classList.remove("hidden");
            k.setCursor("pointer");
            k.debug.inspect = true;
        } else {
            editorUI?.classList.add("hidden");
            k.setCursor("auto");
            k.debug.inspect = false;
        }
    });

    k.onClick("mapObject", (obj) => {
        if (!isEditorOpen) return;
        const mapObj = obj as MapObjectWithPoi;

        // Visual selection feedback
        k.get("mapObject").forEach((o) => {
            o.unuse("color");
            o.color = k.WHITE;
        });
        mapObj.use(k.color(255, 150, 150)); // highlight

        selectedObj = mapObj;
        selectedPoi = portfolioGlossary.find((p) => p.id === mapObj.poiId) ?? null;

        inspector?.classList.remove("hidden");

        // Populate inputs
        if (selectedPoi) {
            nameInput.value = selectedPoi.name || "";
            descInput.value = selectedPoi.dialog?.body || "";
            const linkAction = selectedPoi.actions?.find((a) => a.type === "open_link");
            hrefInput.value = linkAction?.href ?? "";
        } else {
            nameInput.value = mapObj.id;
            descInput.value = "";
            hrefInput.value = "";
        }

        // Parse object's existing area shape bounds if they exist
        if (mapObj.area && mapObj.area.shape) {
            const bb = mapObj.area.shape.bbox();
            hxInput.value = "0"; // Default, to simplify
            hyInput.value = "0";
            hwInput.value = (bb.p2.x - bb.p1.x).toString();
            hhInput.value = (bb.p2.y - bb.p1.y).toString();
        } else {
            hxInput.value = "0"; hyInput.value = "0"; hwInput.value = "0"; hhInput.value = "0";
        }
    });

    saveBtn?.addEventListener("click", () => {
        if (selectedObj) {
            console.log("Saving changes for", selectedObj.id);
            // In a real local app, this would write to node filesystem via fetch/POST
            // For now, we update the object visually to provide instant UI feedback

            if (selectedPoi) {
                selectedPoi.name = nameInput.value;
                selectedPoi.dialog.body = descInput.value;
                const linkAction = selectedPoi.actions?.find((a) => a.type === "open_link");
                if (linkAction) {
                    linkAction.href = hrefInput.value;
                }
            }

            const nw = parseInt(hwInput.value) || 0;
            const nh = parseInt(hhInput.value) || 0;
            const nx = parseInt(hxInput.value) || 0;
            const ny = parseInt(hyInput.value) || 0;

            if (nw > 0 && nh > 0) {
                selectedObj.use(k.area({ shape: new k.Rect(k.vec2(nx, ny), nw, nh) }));
            }

            // Visual success feedback
            saveBtn.textContent = "Saved!";
            saveBtn.classList.add("success");
            setTimeout(() => {
                saveBtn.textContent = "Save Changes";
                saveBtn.classList.remove("success");
            }, 1500);

            alert("Änderungen lokal angewandt! (In der Dev-Umgebung gespeichert)");
        }
    });
}
