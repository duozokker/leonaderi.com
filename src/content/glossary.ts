// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source: /Users/schayan/Dev/leonaderi.com/world-data/project.world.v1.json

import type { PoiEntry } from './types'

export const portfolioGlossary: PoiEntry[] = [
  {
    "id": "company-hq",
    "name": "Company HQ",
    "kind": "company",
    "status": "live",
    "description": "Das Hauptgebaeude deiner Firma.",
    "accentColor": "#e59d39",
    "spriteHint": "hq_gold",
    "dialog": {
      "title": "Company HQ",
      "body": "Hier sieht man dein Business-Profil."
    },
    "tags": [
      "company",
      "services",
      "contact"
    ],
    "district": "Company Quarter",
    "world": {
      "x": 123,
      "y": 96,
      "width": 95,
      "height": 79,
      "hitbox": {
        "x": 20,
        "y": 32,
        "width": 55,
        "height": 40
      },
      "interactRadius": 72,
      "visual": "house",
      "solid": true
    },
    "actions": [
      {
        "id": "company-services",
        "label": "Leistungen anzeigen",
        "type": "open_modal"
      },
      {
        "id": "open-company-dialog",
        "label": "Company Dialog",
        "type": "open_modal"
      },
      {
        "id": "open-company-site",
        "label": "Firmenwebsite",
        "type": "open_link",
        "href": "https://example.com",
        "confirmMessage": "Zur Firmenwebsite wechseln?"
      }
    ]
  },
  {
    "id": "github-house",
    "name": "GitHub Werkstatt",
    "kind": "external_link",
    "status": "live",
    "description": "Code, Repositories und Open-Source-Projekte.",
    "accentColor": "#24292f",
    "spriteHint": "house_github",
    "dialog": {
      "title": "GitHub Werkstatt",
      "body": "Hier sehen Besucher deinen Code."
    },
    "tags": [
      "github",
      "code",
      "opensource"
    ],
    "district": "South District",
    "world": {
      "x": 91,
      "y": 176,
      "width": 74,
      "height": 71,
      "interactRadius": 72,
      "visual": "house",
      "solid": true
    },
    "actions": [
      {
        "id": "github-open",
        "label": "GitHub oeffnen",
        "type": "open_link",
        "href": "https://github.com/your-handle",
        "confirmMessage": "GitHub in neuem Tab oeffnen?"
      }
    ]
  },
  {
    "id": "linkedin-house",
    "name": "LinkedIn Haus",
    "kind": "external_link",
    "status": "live",
    "description": "Lebenslauf und professionelle Timeline.",
    "accentColor": "#0a66c2",
    "spriteHint": "house_linkedin",
    "dialog": {
      "title": "LinkedIn",
      "body": "Hier geht es direkt zu deinem Lebenslauf."
    },
    "tags": [
      "linkedin",
      "cv",
      "career"
    ],
    "district": "Career Lane",
    "world": {
      "x": 222,
      "y": 88,
      "width": 72,
      "height": 88,
      "hitbox": {
        "x": 16,
        "y": 34,
        "width": 44,
        "height": 48
      },
      "interactRadius": 68,
      "visual": "house",
      "solid": true
    },
    "actions": [
      {
        "id": "linkedin-open",
        "label": "LinkedIn oeffnen",
        "type": "open_link",
        "href": "https://www.linkedin.com/in/your-handle",
        "confirmMessage": "LinkedIn in neuem Tab oeffnen?"
      }
    ]
  },
  {
    "id": "npc-guide",
    "name": "Guide NPC",
    "kind": "npc",
    "status": "live",
    "description": "Der Start-NPC erklaert die Welt.",
    "accentColor": "#69b578",
    "spriteHint": "npc_guide",
    "dialog": {
      "title": "Welcome",
      "body": "Erkunde die Stadt und entdecke Inhalte."
    },
    "tags": [
      "npc",
      "tutorial"
    ],
    "district": "Town Plaza",
    "world": {
      "x": 182,
      "y": 146,
      "width": 32,
      "height": 32,
      "interactRadius": 56,
      "visual": "npc",
      "solid": true
    },
    "actions": [
      {
        "id": "guide-controls",
        "label": "Controls anzeigen",
        "type": "open_modal"
      }
    ]
  },
  {
    "id": "sign-controls",
    "name": "Steuerungs-Schild",
    "kind": "sign",
    "status": "live",
    "description": "Kurze Steuerungsinfo fuer Desktop und Mobile.",
    "accentColor": "#8b6b4a",
    "spriteHint": "sign_controls",
    "dialog": {
      "title": "Controls",
      "body": "Desktop: WASD/Pfeile, Interaktion mit E/Enter/Space."
    },
    "tags": [
      "sign",
      "controls"
    ],
    "district": "Town Plaza",
    "world": {
      "x": 214,
      "y": 176,
      "width": 24,
      "height": 24,
      "interactRadius": 48,
      "visual": "sign",
      "solid": false
    },
    "actions": [
      {
        "id": "controls-read",
        "label": "Schild lesen",
        "type": "open_modal"
      },
      {
        "id": "open-controls-dialog",
        "label": "Controls lesen",
        "type": "open_modal"
      }
    ]
  }
]

export const portfolioById = new Map(portfolioGlossary.map((entry) => [entry.id, entry]))
