Original prompt: verbessere den weiter! der ist immer noch buggy und viele sachen kann man nicht benutzen! mache das so lange bis man das wirklich gut nutzen kann und es keine fehler gibt! höre nicht auf und gehe jedes kleinste detail durch. stoppe nur wenn du wirklich nix mehr findest. bevor du dir denkst dass du stoppen willst geh nochmal durch, finde fehler oder sachen die UI/UX technisch noch nicht optimal sind und verbessere sie! mache das als loop dauerhaft für stunden bis das tool perfekt ist

## Session Log
- Initialized progress tracking for worldbuilder stability loop.
- Next: run Playwright client against worldbuilder app, inspect screenshots/state/errors, and iterate fixes.

## TODO
- Reproduce current bugs with scripted interactions and capture baseline artifacts.
- Fix highest-impact UX blockers in canvas selection/resize/pan and inspector sync.
- Improve save/load reliability and user feedback for parse/validation errors.
- Add guardrails for bad numeric input and invalid transforms.
- Re-test with Playwright until no obvious regressions remain.
- Baseline Playwright run completed; screenshots were black canvas-only captures and no render_game_to_text output exists yet.
- Next fixes: add deterministic text-state hook, strengthen canvas rendering observability, and improve UI interactions.
- Confirmed real worldbuilder instance at http://localhost:5188 (earlier runs hit wrong app port).
- Starting UI bug pass: selection/inspector sync, canvas transforms, tabs, and import/save error handling.
- Implemented stability pass in apps/worldbuilder:
  - Added local draft/session autosave to localStorage and reset-local-draft control.
  - Added robust JSON import/apply/save error handling with status toasts.
  - Added duplicate/delete actions (buttons + keyboard shortcuts).
  - Added canvas UX controls: snap grid, labels toggle, Space+drag pan, cursor-centered wheel zoom, reset view.
  - Added trigger resize transform support and disabled entity drag while panning.
  - Added inspector enhancements: trigger type/enabled/interaction ID + NPC interaction ID edits.
  - Added render_game_to_text and advanceTime hooks for automated test loop.
  - Added worldbuilder favicon to remove 404 console error.
- Playwright loop rerun on worldbuilder URL (http://localhost:5188):
  - screenshots generated in output/worldbuilder-loop/after-fixes
  - state JSON generated (state-0..2)
  - no errors-*.json emitted
- Validation:
  - npm run lint ✅
  - npm run build -w @leonaderi/worldbuilder ✅
  - npm run build (root) ✅

## Remaining Ideas
- Add marquee/multi-select and true drag-resize handles for side-specific constraints.
- Add dedicated trigger-to-interaction editor table (create/select actions inline).
- Add minimap + fit-to-selection for large maps.
- Add undo/redo stack persisted in session.
- Final verification pass done after setting strict worldbuilder dev port to 5188.
- Playwright artifacts: output/worldbuilder-loop/final-pass (shots + state; no errors files).
- Loop 2 completed:
  - Added object layer system improvements: render order now uses renderGroup + depth.
  - Added object layer inspector controls: depth nudge buttons, depth=y helper, render group, visibility, blocking toggle.
  - Added Undo/Redo controls + keyboard shortcuts (Cmd/Ctrl+Z, Shift+Z, Y).
  - Added camera UX: Fit Map button, Arrow-key panning, middle-mouse grab pan, clamped camera bounds.
  - Added minimap overlay with viewport rectangle.
  - Added richer render_game_to_text payload (history and top layers).
- Playwright run: output/worldbuilder-loop/loop-2 (shots + state, no errors file).
- Loop 3 completed:
  - Added frameSelection (F) and fitMap (Shift+F / toolbar).
  - Added per-layer visibility toggles (objects/colliders/triggers/npcs/minimap).
  - Added per-layer lock toggles to prevent accidental drag edits.
  - Added camera grab-pan with middle mouse hold + move.
  - Added keyboard camera panning (arrows, Shift for faster panning).
  - Updated state telemetry to include layer visibility/lock.
- Playwright run: output/worldbuilder-loop/loop-3 (shots + state, no errors file).
- Loop 4 completed:
  - Added real rendered map background mode in canvas using map-v1 composite image.
  - Added background mode switch: Abstract / Rendered / Blend with blend opacity slider.
  - Added trigger-action inspector editing for interaction actions (dialogue/link/toast/flag/teleport/modal).
  - Verified rendered mode visually in browser snapshot (manual-rendered-view.png).
- Playwright run: output/worldbuilder-loop/loop-4 (shots + state, no errors file).

## Research Notes (editor UX references)
- Tiled editor emphasizes layer visibility/lock and map-level editing workflows.
- Unity scene workflow emphasizes framing selection and camera navigation speed.
- Godot 2D editor emphasizes intuitive viewport pan/zoom and tool-mode shortcuts.
- Loop 5 completed:
  - Added entity search filter for Objects/Colliders/Triggers/NPCs/POIs list.
  - Added object helper actions: "Auto Collider from Object" and "Create Door Trigger".
  - Added trigger->interaction action editor to configure dialogue/link/toast/flag/teleport/modal flows directly.
- Loop 6 completed:
  - Added live cursor world/tile coordinates in toolbar.
  - Added optional crosshair lines on canvas for precise alignment.
- Playwright runs: output/worldbuilder-loop/loop-5 and loop-6 (shots + state, no errors files).
