# Content Glossary Model

## Goal
Enable easy updates without editing gameplay logic.

## Canonical File
- `src/content/glossary.ts`

## Entry Types
- `company`: firm profile and CTAs
- `external_link`: LinkedIn, GitHub, social platforms
- `project_showcase`: interactive project cards
- `social`: growth channels (YouTube, Twitter)
- `npc`: lore/help/hints
- `sign`: short static messages
- `coming_soon`: placeholder building states

## Status System
- `live`: fully available
- `wip`: exists but still under production
- `coming_soon`: planned, not open yet
- `ruins`: visual storytelling and future reveal potential

## Required Fields (minimum)
- `id`
- `name`
- `kind`
- `status`
- `description`
- `dialog.title`
- `dialog.body`

## Optional Fields
- `spriteHint`
- `accentColor`
- `tags`
- `actions[]` (`open_link`, `open_modal`, `coming_soon`)
- `location` (`district`, `mapObjectId`)

## Update Workflow
1. Add/edit entry in `glossary.ts`.
2. Attach or update sprite references.
3. If new action type needed, extend action handler in game system.
4. Verify in both desktop and mobile.

