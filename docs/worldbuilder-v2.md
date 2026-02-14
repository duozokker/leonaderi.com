# Worldbuilder V2

Worldbuilder V2 ist eine separate lokale App unter `apps/worldbuilder`.
Die Website bleibt Runtime-Consumer und liest nur generierte Dateien.

## Ziele
- Editor und Website logisch trennen
- Authoring als JSON Source of Truth (`world-data/project.world.v1.json`)
- Deterministischer Compile-Schritt in Runtime-Dateien

## Workspace-Struktur
- `apps/worldbuilder`: lokales Studio (React + Konva + React Flow)
- `packages/world-schema`: zod-Schema + Typen für Authoring/Runtime
- `packages/world-compiler`: Compiler + CLI
- `world-data/project.world.v1.json`: kanonische World-Datei

## Befehle
- `npm run worldbuilder:dev` startet den lokalen Editor
- `npm run world:validate` validiert `world-data/project.world.v1.json`
- `npm run world:compile` erzeugt Runtime-Dateien
- `npm run world:compile:check` prüft Drift (CI-Guard)

## Generierte Runtime-Dateien
- `src/content/glossary.ts`
- `src/game/world/mapData.ts`
- `src/content/uiTextGenerated.ts`

## Workflow
1. Editor öffnen: `npm run worldbuilder:dev`
2. Objekte, Collider, Trigger, NPCs, Dialoge bearbeiten
3. JSON speichern (Datei-Dialog oder Export)
4. JSON ins Repo unter `world-data/project.world.v1.json` legen
5. `npm run world:compile`
6. Website starten mit `npm run dev`

## Editor Features (V1)
- Canvas mit Terrain + Objektlayern
- Zweifarbige Outlines:
  - Orange: Objekt-Bounds
  - Cyan: Collider
  - Magenta: Trigger
  - Gelb: NPCs
- Drag/Resize direkt auf der Canvas
- Inspector für numerische Feinanpassungen
- Dialog-Ansicht mit React Flow
- Validation-Panel für Referenzfehler
- JSON-Tab für direkte Bearbeitung

## Hinweise
- Der Runtime-Build (`npm run build`) enthält automatisch `world:compile:check`.
- Wenn `build` wegen Drift fehlschlägt: zuerst `npm run world:compile` ausführen und committen.
