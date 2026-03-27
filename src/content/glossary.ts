// Portfolio content registry.

import type { PoiEntry } from './types'

export const portfolioGlossary: PoiEntry[] = [
  {
    "id": "company-hq",
    "name": "Artesiana HQ",
    "kind": "company",
    "status": "live",
    "description": "Main company building for services, case studies, contact paths, and project inquiries.",
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
        "label": "Open company website",
        "type": "open_link",
        "href": "https://artesiana.de",
        "confirmMessage": "Open the company website?"
      },
      {
        "id": "company-services",
        "label": "Show services",
        "type": "open_modal"
      }
    ]
  },
  {
    "id": "construction-ruins",
    "name": "Ruins",
    "kind": "coming_soon",
    "status": "ruins",
    "description": "Placeholder building reserved for a future release.",
    "accentColor": "#7b7b7b",
    "spriteHint": "house_ruins",
    "dialog": {
      "title": "Production Zone",
      "body": "This building will be repaired and unlocked with new content later."
    },
    "tags": [
      "ruins",
      "coming-soon",
      "future"
    ],
    "district": "South District",
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
        "label": "Currently closed",
        "type": "coming_soon"
      }
    ]
  },
  {
    "id": "github-house",
    "name": "GitHub Werkstatt",
    "kind": "external_link",
    "status": "live",
    "description": "Code, repositories, and open-source work as proof of craft.",
    "accentColor": "#24292f",
    "spriteHint": "house_github",
    "dialog": {
      "title": "GitHub Werkstatt",
      "body": "Visitors can browse code, commit history, and active projects here."
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
        "label": "GitHub öffnen",
        "type": "open_link",
        "href": "https://github.com/duozokker",
        "confirmMessage": "GitHub in neuem Tab öffnen?"
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
      "body": "This leads directly to the CV and professional profile."
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
        "label": "LinkedIn öffnen",
        "type": "open_link",
        "href": "https://www.linkedin.com/in/leo-naderi-3a9761307",
        "confirmMessage": "LinkedIn in neuem Tab öffnen?"
      }
    ]
  },
  {
    "id": "npc-guide",
    "name": "Guide",
    "kind": "npc",
    "status": "live",
    "description": "Starter NPC explaining the world, controls, and basic goals.",
    "accentColor": "#69b578",
    "spriteHint": "npc_guide",
    "dialog": {
      "title": "Welcome Guide",
      "body": "Explore the town, talk to NPCs, and discover links to profile, projects, and company work."
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
        "label": "Show controls",
        "type": "open_modal"
      }
    ]
  },
  {
    "id": "npc-recruiter-secret",
    "name": "Recruiter",
    "kind": "npc",
    "status": "live",
    "description": "Hidden NPC with a small easter-egg interaction for curious visitors.",
    "accentColor": "#c3b85f",
    "spriteHint": "npc_recruiter",
    "dialog": {
      "title": "Secret Quest",
      "body": "Find the three most interesting places in town and you officially become an explorer."
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
        "label": "Read quest",
        "type": "open_modal"
      }
    ]
  },
  {
    "id": "projects-lab",
    "name": "Fun Projects Lab",
    "kind": "project_showcase",
    "status": "live",
    "description": "Playful side projects, experiments, and creative demos.",
    "accentColor": "#2ca58d",
    "spriteHint": "house_projects",
    "dialog": {
      "title": "Fun Projects Lab",
      "body": "This lab contains experiments, side projects, and demos."
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
        "label": "Show project list",
        "type": "open_modal"
      }
    ]
  },
  {
    "id": "sign-about",
    "name": "About Sign",
    "kind": "sign",
    "status": "live",
    "description": "Short explanation of the site concept and portfolio world.",
    "accentColor": "#8d7d58",
    "spriteHint": "sign_about",
    "dialog": {
      "title": "About This World",
      "body": "This site is a portfolio world. Each location represents a different part of the work."
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
    "name": "Controls Sign",
    "kind": "sign",
    "status": "live",
    "description": "Quick controls reference for desktop and mobile.",
    "accentColor": "#8b6b4a",
    "spriteHint": "sign_controls",
    "dialog": {
      "title": "Controls",
      "body": "Desktop: WASD or arrow keys. Interact: E, Enter, Space, or click. Mobile: D-pad plus interact."
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
    "description": "Short updates, build-in-public notes, and spontaneous thoughts.",
    "accentColor": "#1d9bf0",
    "spriteHint": "house_twitter",
    "dialog": {
      "title": "Twitter Kiosk",
      "body": "This channel is not active yet, but the location is ready for later activation."
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
        "id": "twitter-soon",
        "label": "Still in ruins",
        "type": "coming_soon"
      }
    ]
  },
  {
    "id": "youtube-house",
    "name": "YouTube Studio",
    "kind": "social",
    "status": "coming_soon",
    "description": "Planned studio for videos, devlogs, and tutorials.",
    "accentColor": "#c4302b",
    "spriteHint": "house_youtube",
    "dialog": {
      "title": "YouTube Studio",
      "body": "This location is still under construction. Video formats can go live here later."
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
        "label": "Coming soon",
        "type": "coming_soon"
      }
    ]
  }
]

export const portfolioById = new Map(portfolioGlossary.map((entry) => [entry.id, entry]))
