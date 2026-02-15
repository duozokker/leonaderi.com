// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source: /Users/schayan/Dev/leonaderi.com/world-data/project.world.v1.json

import type { PoiEntry } from './types'

export const portfolioGlossary: PoiEntry[] = [
  {
    "id": "company-hq",
    "name": "Company HQ",
    "kind": "company",
    "status": "live",
    "description": "Das Hauptgebaeude deiner Firma: Leistungen, Cases, Kontakt und wie man mit dir arbeitet.",
    "accentColor": "#e59d39",
    "spriteHint": "hq_gold",
    "dialog": {
      "title": "Company HQ",
      "body": "Hier sieht man dein Business-Profil, Leistungen und wie man ein Projekt mit dir startet."
    },
    "tags": [
      "company",
      "services",
      "contact"
    ],
    "district": "Company Quarter",
    "world": {
      "x": 503,
      "y": 208,
      "width": 95,
      "height": 79,
      "interactRadius": 72,
      "visual": "house",
      "solid": true
    },
    "actions": [
      {
        "id": "company-website",
        "label": "Firmenwebsite oeffnen",
        "type": "open_link",
        "href": "https://example.com",
        "confirmMessage": "Zur Firmenwebsite wechseln?"
      },
      {
        "id": "company-services",
        "label": "Leistungen anzeigen",
        "type": "open_modal"
      }
    ]
  },
  {
    "id": "construction-ruins",
    "name": "Ruinen",
    "kind": "coming_soon",
    "status": "ruins",
    "description": "Verstaubtes Haus als Platzhalter fuer zukuenftige Releases.",
    "accentColor": "#7b7b7b",
    "spriteHint": "house_ruins",
    "dialog": {
      "title": "Production Zone",
      "body": "Dieses Haus wird spaeter mit neuem Content repariert und freigeschaltet."
    },
    "tags": [
      "ruins",
      "coming-soon",
      "future"
    ],
    "district": "South",
    "world": {
      "x": 250,
      "y": 464,
      "width": 64,
      "height": 64,
      "interactRadius": 68,
      "visual": "house",
      "solid": true
    },
    "actions": [
      {
        "id": "ruins-soon",
        "label": "Noch geschlossen",
        "type": "coming_soon"
      }
    ]
  },
  {
    "id": "github-house",
    "name": "GitHub Werkstatt",
    "kind": "external_link",
    "status": "live",
    "description": "Code, Repositories und Open-Source-Projekte als technischer Nachweis.",
    "accentColor": "#24292f",
    "spriteHint": "house_github",
    "dialog": {
      "title": "GitHub Werkstatt",
      "body": "Hier sehen Besucher deinen Code, Commit-Historie und aktive Projekte."
    },
    "tags": [
      "github",
      "code",
      "opensource"
    ],
    "district": "South District",
    "world": {
      "x": 345,
      "y": 417.5,
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
    "description": "Lebenslauf und professionelle Timeline sind ueber LinkedIn erreichbar.",
    "accentColor": "#0a66c2",
    "spriteHint": "house_linkedin",
    "dialog": {
      "title": "LinkedIn",
      "body": "Hier geht es direkt zu deinem Lebenslauf und professionellen Profil."
    },
    "tags": [
      "linkedin",
      "cv",
      "career"
    ],
    "district": "Career Lane",
    "world": {
      "x": 696.4,
      "y": 142.4,
      "width": 72,
      "height": 88,
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
    "description": "Der Start-NPC erklaert die Welt, Steuerung und Ziele.",
    "accentColor": "#69b578",
    "spriteHint": "npc_guide",
    "dialog": {
      "title": "Welcome Trainer",
      "body": "Erkunde die Stadt, rede mit NPCs und entdecke Links zu Profil, Projekten und deiner Firma."
    },
    "tags": [
      "npc",
      "tutorial"
    ],
    "district": "Town Plaza",
    "world": {
      "x": 497.5,
      "y": 296.5,
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
    "id": "npc-recruiter-secret",
    "name": "Recruiter NPC",
    "kind": "npc",
    "status": "live",
    "description": "Geheimer NPC mit Mini-Quest fuer neugierige Besucher.",
    "accentColor": "#c3b85f",
    "spriteHint": "npc_recruiter",
    "dialog": {
      "title": "Secret Quest",
      "body": "Finde die drei spannendsten Orte in der Stadt. Dann bist du offiziell Explorer."
    },
    "tags": [
      "npc",
      "easter-egg",
      "quest"
    ],
    "district": "Hidden Corner",
    "world": {
      "x": 347.5,
      "y": 308,
      "width": 32,
      "height": 32,
      "interactRadius": 56,
      "visual": "npc",
      "solid": true
    },
    "actions": [
      {
        "id": "quest-modal",
        "label": "Quest lesen",
        "type": "open_modal"
      }
    ]
  },
  {
    "id": "projects-lab",
    "name": "Fun Projects Lab",
    "kind": "project_showcase",
    "status": "live",
    "description": "Spielerische und kreative Projekte mit kurzen Erklaerungen und Links.",
    "accentColor": "#2ca58d",
    "spriteHint": "house_projects",
    "dialog": {
      "title": "Fun Projects Lab",
      "body": "Hier liegen deine coolen Experimente, Side Projects und Demos."
    },
    "tags": [
      "projects",
      "creative",
      "experiments"
    ],
    "district": "East Quarter",
    "world": {
      "x": 752.5,
      "y": 253.5,
      "width": 96,
      "height": 97,
      "interactRadius": 72,
      "visual": "house",
      "solid": true
    },
    "actions": [
      {
        "id": "projects-list",
        "label": "Projektliste anzeigen",
        "type": "open_modal"
      }
    ]
  },
  {
    "id": "sign-about",
    "name": "About-Schild",
    "kind": "sign",
    "status": "live",
    "description": "Ein kurzer Pitch ueber dich und die Idee der Seite.",
    "accentColor": "#8d7d58",
    "spriteHint": "sign_about",
    "dialog": {
      "title": "About This World",
      "body": "Diese Website ist deine Portfolio-Welt. Jede Location repraesentiert einen Teil deiner Arbeit."
    },
    "tags": [
      "sign",
      "about"
    ],
    "district": "Town Plaza",
    "world": {
      "x": 430,
      "y": 304,
      "width": 24,
      "height": 26,
      "interactRadius": 48,
      "visual": "sign",
      "solid": false
    },
    "actions": [
      {
        "id": "action-sign-about-coming-soon",
        "label": "Coming soon",
        "type": "coming_soon"
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
      "body": "Desktop: WASD oder Pfeiltasten. Interaktion: E, Enter, Space oder Klick. Mobile: D-Pad + Interact."
    },
    "tags": [
      "sign",
      "controls"
    ],
    "district": "Town Plaza",
    "world": {
      "x": 540,
      "y": 264,
      "width": 24,
      "height": 26,
      "interactRadius": 48,
      "visual": "sign",
      "solid": false
    },
    "actions": [
      {
        "id": "action-sign-controls-coming-soon",
        "label": "Coming soon",
        "type": "coming_soon"
      }
    ]
  },
  {
    "id": "twitter-house",
    "name": "Twitter Kiosk",
    "kind": "social",
    "status": "wip",
    "description": "Kurze Updates, Build-in-public und spontane Gedanken.",
    "accentColor": "#1d9bf0",
    "spriteHint": "house_twitter",
    "dialog": {
      "title": "Twitter Kiosk",
      "body": "Der Kanal wird vorbereitet. Du kannst ihn spaeter einfach per Glossar aktivieren."
    },
    "tags": [
      "twitter",
      "social",
      "wip"
    ],
    "district": "South East",
    "world": {
      "x": 580,
      "y": 401,
      "width": 104,
      "height": 97,
      "interactRadius": 72,
      "visual": "house",
      "solid": true
    },
    "actions": [
      {
        "id": "twitter-open",
        "label": "Twitter oeffnen",
        "type": "open_link",
        "href": "https://x.com/your-handle",
        "confirmMessage": "Twitter in neuem Tab oeffnen?"
      }
    ]
  },
  {
    "id": "youtube-house",
    "name": "YouTube Studio",
    "kind": "social",
    "status": "coming_soon",
    "description": "Geplantes Studio fuer Videos, Devlogs und Tutorials.",
    "accentColor": "#c4302b",
    "spriteHint": "house_youtube",
    "dialog": {
      "title": "YouTube Studio",
      "body": "Diese Location ist noch im Bau. Bald erscheinen hier Video-Formate."
    },
    "tags": [
      "youtube",
      "content",
      "coming-soon"
    ],
    "district": "West Island",
    "world": {
      "x": 242,
      "y": 234.5,
      "width": 99,
      "height": 93,
      "interactRadius": 72,
      "visual": "house",
      "solid": true
    },
    "actions": [
      {
        "id": "youtube-soon",
        "label": "Coming Soon",
        "type": "coming_soon"
      }
    ]
  }
]

export const portfolioById = new Map(portfolioGlossary.map((entry) => [entry.id, entry]))
