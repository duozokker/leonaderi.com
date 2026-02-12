import type { PoiEntry } from './types'

export const portfolioGlossary: PoiEntry[] = [
  {
    id: 'company-hq',
    name: 'Company HQ',
    kind: 'company',
    status: 'live',
    description:
      'Das Hauptgebaeude deiner Selbststaendigkeit mit Services, Cases und Kontakt.',
    accentColor: '#e6a339',
    spriteHint: 'large_hq_orange',
    dialog: {
      title: 'Willkommen im Company HQ',
      body: 'Hier finden Besucher, was du als Firma anbietest und wie man mit dir zusammenarbeitet.',
    },
    tags: ['company', 'services', 'contact'],
    location: { district: 'Downtown', mapObjectId: 'house-company-01' },
    actions: [
      {
        id: 'company-site',
        label: 'Zur Firmenwebseite',
        type: 'open_link',
        href: 'https://example.com',
        confirmMessage: 'Du verlaesst jetzt die Spielwelt und oeffnest die Firmenwebseite.',
      },
      {
        id: 'company-contact',
        label: 'Kontakt anzeigen',
        type: 'open_modal',
      },
    ],
  },
  {
    id: 'linkedin-house',
    name: 'LinkedIn Haus',
    kind: 'external_link',
    status: 'live',
    description:
      'Professionelle Timeline, Lebenslauf und Business-Kontext.',
    accentColor: '#0a66c2',
    spriteHint: 'house_blue',
    dialog: {
      title: 'LinkedIn Profil',
      body: 'Dein Lebenslauf wird primaer ueber LinkedIn erreichbar sein.',
    },
    tags: ['linkedin', 'cv', 'career'],
    location: { district: 'Main Street', mapObjectId: 'house-linkedin-01' },
    actions: [
      {
        id: 'linkedin-open',
        label: 'LinkedIn oeffnen',
        type: 'open_link',
        href: 'https://www.linkedin.com/in/your-handle',
        confirmMessage: 'LinkedIn in neuem Tab oeffnen?',
      },
    ],
  },
  {
    id: 'github-workshop',
    name: 'GitHub Werkstatt',
    kind: 'external_link',
    status: 'live',
    description:
      'Code, Repositories und Open-Source-Aktivitaet als technischer Nachweis.',
    accentColor: '#24292f',
    spriteHint: 'workshop_dark',
    dialog: {
      title: 'GitHub Werkstatt',
      body: 'Hier sehen Besucher echten Code, Commit-Historie und Projektqualitaet.',
    },
    tags: ['github', 'repositories', 'opensource'],
    location: { district: 'Main Street', mapObjectId: 'house-github-01' },
    actions: [
      {
        id: 'github-open',
        label: 'GitHub oeffnen',
        type: 'open_link',
        href: 'https://github.com/your-handle',
        confirmMessage: 'GitHub in neuem Tab oeffnen?',
      },
    ],
  },
  {
    id: 'project-lab',
    name: 'Fun Projects Lab',
    kind: 'project_showcase',
    status: 'wip',
    description:
      'Kuratiertes Haus fuer experimentelle und lustige Projekte mit Demo-Links.',
    accentColor: '#4ba3a6',
    spriteHint: 'lab_teal',
    dialog: {
      title: 'Fun Projects Lab',
      body: 'Hier kommen deine kreativen Side-Projects rein, inkl. Vorschau und Tech-Stack.',
    },
    tags: ['projects', 'experiments', 'demo'],
    location: { district: 'Innovation Alley', mapObjectId: 'lab-projects-01' },
    actions: [
      {
        id: 'projects-open-modal',
        label: 'Projektliste anzeigen',
        type: 'open_modal',
      },
    ],
  },
  {
    id: 'youtube-studio',
    name: 'YouTube Studio',
    kind: 'social',
    status: 'coming_soon',
    description:
      'Geplantes Gebaeude fuer Videos, Devlogs und Build-in-public Content.',
    accentColor: '#c4302b',
    spriteHint: 'house_scaffold_red',
    dialog: {
      title: 'Baustelle: YouTube Studio',
      body: 'Dieses Haus ist noch im Bau. Bald findest du hier Video-Content.',
    },
    tags: ['youtube', 'coming-soon'],
    location: { district: 'Social Corner', mapObjectId: 'house-youtube-01' },
    actions: [
      {
        id: 'youtube-coming-soon',
        label: 'Coming Soon',
        type: 'coming_soon',
      },
    ],
  },
  {
    id: 'twitter-kiosk',
    name: 'Twitter Kiosk',
    kind: 'social',
    status: 'coming_soon',
    description: 'Social-Knotenpunkt fuer kurze Updates und Gedanken.',
    accentColor: '#1d9bf0',
    spriteHint: 'kiosk_blue_scaffold',
    dialog: {
      title: 'Twitter Kiosk',
      body: 'Noch nicht freigeschaltet. Wird spaeter ueber das Glossar aktiviert.',
    },
    tags: ['twitter', 'social', 'coming-soon'],
    location: { district: 'Social Corner', mapObjectId: 'house-twitter-01' },
    actions: [
      {
        id: 'twitter-coming-soon',
        label: 'Coming Soon',
        type: 'coming_soon',
      },
    ],
  },
  {
    id: 'npc-guide',
    name: 'Guide NPC',
    kind: 'npc',
    status: 'live',
    description: 'Hilft Erstbesuchern bei Orientierung und Steuerung.',
    accentColor: '#84b87d',
    spriteHint: 'npc_guide_green',
    dialog: {
      title: 'Willkommen in der Portfolio Town',
      body: 'Nutze WASD/Pfeiltasten oder am Handy den Joystick. Geh zu den Haeusern und entdecke die Inhalte.',
    },
    tags: ['npc', 'onboarding'],
    location: { district: 'Town Square', mapObjectId: 'npc-guide-01' },
    actions: [
      {
        id: 'npc-help',
        label: 'Controls ansehen',
        type: 'open_modal',
      },
    ],
  },
  {
    id: 'sign-controls',
    name: 'Steuerungs-Schild',
    kind: 'sign',
    status: 'live',
    description: 'Erklaert Steuerung und Ziel der Website.',
    accentColor: '#8b6b4a',
    spriteHint: 'wood_sign',
    dialog: {
      title: 'Controls',
      body: 'Desktop: WASD oder Pfeiltasten. Mobile: Joystick + Interact Button.',
    },
    tags: ['sign', 'controls'],
    location: { district: 'Town Square', mapObjectId: 'sign-controls-01' },
    actions: [],
  },
]

