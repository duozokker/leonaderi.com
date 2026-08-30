// Portfolio content registry.
// All player-facing POI/NPC copy lives here (both languages), not in the runtime.

import type { NpcEntry, PoiEntry, ProjectEntry } from './types'

export const portfolioGlossary: PoiEntry[] = [
  {
    id: 'company-hq',
    name: 'Artesiana HQ',
    kind: 'company',
    status: 'live',
    description: 'Main company building for services, case studies, contact paths, and project inquiries.',
    accentColor: '#e59d39',
    spriteHint: 'hq_gold',
    dialog: {
      title: { en: 'Artesiana HQ', de: 'Artesiana HQ' },
      body: {
        en: 'Here you can see my business profile, services, and how to start a project with me.',
        de: 'Hier findest du mein Business-Profil, meine Leistungen und wie man ein Projekt mit mir startet.',
      },
    },
    tags: ['company', 'services', 'contact'],
    district: 'Company Quarter',
    world: {
      x: 503,
      y: 208,
      width: 95,
      height: 79,
      interactRadius: 72,
      visual: 'house',
      solid: true,
    },
    actions: [
      {
        id: 'company-website',
        label: { en: 'Open Artesiana Website', de: 'Artesiana öffnen' },
        type: 'open_link',
        href: 'https://artesiana.de',
      },
    ],
  },
  {
    id: 'github-house',
    name: 'GitHub Werkstatt',
    kind: 'external_link',
    status: 'live',
    description: 'Code, repositories, and open-source work as proof of craft.',
    accentColor: '#24292f',
    spriteHint: 'house_github',
    dialog: {
      title: { en: 'GitHub Workshop', de: 'GitHub Werkstatt' },
      body: {
        en: 'Here visitors can see my code, commit history, and active projects.',
        de: 'Hier sehen Besucher meinen Code, meine Commit-Historie und aktive Projekte.',
      },
    },
    tags: ['github', 'code', 'opensource'],
    district: 'South District',
    world: {
      x: 345,
      y: 417.5,
      width: 74,
      height: 71,
      interactRadius: 72,
      visual: 'house',
      solid: true,
    },
    actions: [
      {
        id: 'github-open',
        label: { en: 'Open GitHub', de: 'GitHub öffnen' },
        type: 'open_link',
        href: 'https://github.com/duozokker',
      },
    ],
  },
  {
    id: 'linkedin-house',
    name: 'LinkedIn Haus',
    kind: 'external_link',
    status: 'live',
    description: 'CV and professional timeline, reachable via LinkedIn.',
    accentColor: '#0a66c2',
    spriteHint: 'house_linkedin',
    dialog: {
      title: { en: 'LinkedIn', de: 'LinkedIn' },
      body: {
        en: 'This leads directly to my CV and professional profile.',
        de: 'Hier geht es direkt zu meinem Lebenslauf und professionellen Profil.',
      },
    },
    tags: ['linkedin', 'cv', 'career'],
    district: 'Career Lane',
    world: {
      x: 696.4,
      y: 142.4,
      width: 72,
      height: 88,
      interactRadius: 68,
      visual: 'house',
      solid: true,
    },
    actions: [
      {
        id: 'linkedin-open',
        label: { en: 'Open LinkedIn', de: 'LinkedIn öffnen' },
        type: 'open_link',
        href: 'https://www.linkedin.com/in/leo-naderi-3a9761307',
      },
    ],
  },
  {
    id: 'projects-lab',
    name: 'Fun Projects Lab',
    kind: 'project_showcase',
    status: 'live',
    description: 'Playful side projects, experiments, and creative demos.',
    accentColor: '#2ca58d',
    spriteHint: 'house_projects',
    dialog: {
      title: { en: 'Fun Projects Lab', de: 'Projektlabor' },
      body: {
        en: 'Here are my experiments, side projects, and demos.',
        de: 'Hier liegen meine Experimente, Side Projects und Demos.',
      },
    },
    tags: ['projects', 'creative', 'experiments'],
    district: 'East Quarter',
    world: {
      x: 752.5,
      y: 253.5,
      width: 96,
      height: 97,
      interactRadius: 72,
      visual: 'house',
      solid: true,
    },
    actions: [
      {
        id: 'projects-list',
        label: { en: 'Show Project List', de: 'Projektliste anzeigen' },
        type: 'open_modal',
        modalId: 'projects',
      },
    ],
  },
  {
    id: 'twitter-house',
    name: 'Twitter Kiosk',
    kind: 'social',
    status: 'wip',
    description: 'Short updates, build-in-public notes, and spontaneous thoughts.',
    accentColor: '#1d9bf0',
    spriteHint: 'house_twitter',
    dialog: {
      title: { en: 'Twitter Kiosk', de: 'Twitter Kiosk' },
      body: {
        en: "I'm just a broken ruin... leave me alone. I used to tweet, now I only collect dust.",
        de: 'Ich bin nur eine kaputte Ruine... lass mich in Ruhe. Früher wurde hier getwittert, jetzt gibt es nur noch Staub.',
      },
    },
    tags: ['twitter', 'social', 'wip'],
    district: 'South East',
    world: {
      x: 580,
      y: 401,
      width: 104,
      height: 97,
      interactRadius: 72,
      visual: 'house',
      solid: true,
    },
    actions: [
      {
        id: 'twitter-soon',
        label: { en: 'Ruin Is Offline', de: 'Ruine ist offline' },
        type: 'coming_soon',
      },
    ],
  },
  {
    id: 'youtube-house',
    name: 'YouTube Studio',
    kind: 'social',
    status: 'coming_soon',
    description: 'Planned studio for videos, devlogs, and tutorials.',
    accentColor: '#c4302b',
    spriteHint: 'house_youtube',
    dialog: {
      title: { en: 'YouTube Studio', de: 'YouTube Studio' },
      body: {
        en: 'This studio is all rubble and bad acoustics right now. Come back when the roof stops leaking.',
        de: 'Dieses Studio ist gerade nur Schutt und schlechte Akustik. Komm wieder, wenn das Dach nicht mehr leckt.',
      },
    },
    tags: ['youtube', 'content', 'coming-soon'],
    district: 'West Island',
    world: {
      x: 242,
      y: 234.5,
      width: 99,
      height: 93,
      interactRadius: 72,
      visual: 'house',
      solid: true,
    },
    actions: [
      {
        id: 'youtube-soon',
        label: { en: 'Coming Soon', de: 'Bald verfügbar' },
        type: 'coming_soon',
      },
    ],
  },
]

export const portfolioById = new Map(portfolioGlossary.map((entry) => [entry.id, entry]))

// NPCs. Ids match the spawn table in main.ts / NPC_POSITIONS in mapData.ts.
export const npcGlossary: NpcEntry[] = [
  {
    id: 'guide_fountain',
    spriteKey: 'guide',
    positionKey: 'guide',
    name: { en: 'Guide', de: 'Guide' },
    avatar: '/assets/game/pixellab/characters/npc/guide/south.png',
    dialog: {
      en: 'Hey there! Did you know Leo built this entire engine from scratch using Kaboom.js? He specializes in high-performance web apps and interactive experiences. Take a look around!',
      de: 'Hallo! Wusstest du, dass Leo diese ganze Engine von Grund auf mit Kaboom.js gebaut hat? Er ist Experte für hochperformante Web-Apps und interaktive Erlebnisse. Schau dich ruhig um!',
    },
  },
  {
    id: 'recruiter',
    spriteKey: 'recruiter',
    positionKey: 'recruiter',
    name: { en: 'Recruiter', de: 'Recruiter' },
    avatar: '/assets/game/pixellab/characters/npc/recruiter/south.png',
    special: 'recruiter_easteregg',
    dialog: {
      en: "I've been looking for a 10x engineer everywhere! Leo's architecture here is pristine – zero-allocation game loops, perfect memory management... it's a masterpiece.",
      de: 'Ich suche überall nach einem 10x Engineer! Leos Architektur hier ist makellos – Zero-Allocation Game Loops, perfektes Speichermanagement... Ein Meisterwerk.',
    },
  },
  {
    id: 'villager_ruins',
    spriteKey: 'villager',
    positionKey: 'villageNpc',
    name: { en: 'Local Dev', de: 'Local Dev' },
    avatar: '/assets/game/pixellab/characters/npc/south.png',
    dialog: {
      en: 'I heard Leo uses modern tech stacks like TypeScript and Vite. He even built a custom map compiler for this world to parse Wang tiles seamlessly!',
      de: 'Ich habe gehört, Leo nutzt moderne Tech-Stacks wie TypeScript und Vite. Er hat sogar einen eigenen Map-Compiler für diese Welt geschrieben, um die Wang-Tiles nahtlos zu parsen!',
    },
  },
  {
    id: 'fisher',
    spriteKey: 'villager-east',
    positionKey: 'guideNpc2',
    name: { en: 'Fisherman', de: 'Fischer' },
    avatar: '/assets/game/pixellab/characters/npc/east.png',
    dialog: {
      en: "The sea is quiet today... Sometimes I see a bug float by, but Leo usually squashes them before I can catch 'em.",
      de: 'Das Meer ist heute ruhig... Manchmal treibt ein Bug vorbei, aber Leo behebt ihn meistens, bevor ich ihn fangen kann.',
    },
  },
  {
    id: 'cute_girl',
    spriteKey: 'cuteGirl',
    positionKey: 'cuteGirl',
    name: { en: 'Alma', de: 'Alma' },
    avatar: '/assets/game/pixellab/characters/npc/cute_girl.png',
    special: 'birthday_gate',
    dialog: {
      en: "Oh, hi! I'm Alma. I'm doing my semester abroad in Eindhoven right now, just visiting this little town. Psst... if a certain someone gave you a secret word, type it in below.",
      de: 'Oh, hi! Ich bin Alma. Ich mache gerade mein Auslandssemester in Eindhoven und bin hier nur zu Besuch. Psst... wenn dir ein gewisser Jemand ein Geheimwort verraten hat, tipp es unten ein.',
    },
  },
]

// Extra line for the recruiter easter egg (third time you talk to him).
export const recruiterEasterEgg = {
  en: "You're persistent, I like that! You're hired! Have some celebration confetti! 🎉",
  de: 'Du bist hartnäckig, das gefällt mir! Du bist eingestellt! Nimm etwas Konfetti! 🎉',
}

export const npcById = new Map(npcGlossary.map((entry) => [entry.id, entry]))

// Projects shown in the Fun Projects Lab modal.
export const projects: ProjectEntry[] = [
  {
    id: 'portfolio-world',
    title: { en: 'This World', de: 'Diese Welt' },
    description: {
      en: 'The site you are walking through right now: a playable pixel town built with TypeScript and Kaboom.js. The source is public.',
      de: 'Die Seite, durch die du gerade läufst: eine begehbare Pixel-Stadt, gebaut mit TypeScript und Kaboom.js. Der Quellcode ist öffentlich.',
    },
    href: 'https://github.com/duozokker/leonaderi.com',
    linkLabel: { en: 'View Source', de: 'Quellcode ansehen' },
  },
  {
    id: 'more-soon',
    title: { en: 'More In The Lab', de: 'Mehr im Labor' },
    description: {
      en: 'The next experiments are still on the workbench. Check back after the next release.',
      de: 'Die nächsten Experimente liegen noch auf der Werkbank. Schau nach dem nächsten Release wieder vorbei.',
    },
  },
]
