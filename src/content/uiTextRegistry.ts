import type { UITextOverrides } from '../ui/admin/types'

export const UI_TEXT_DEFAULTS = {
  'hud.title': 'Leonaderi Pixel World',
  'hud.subtitle': 'Bewege dich mit WASD/Pfeiltasten und erkunde die Stadt.',
  'hud.helpButton': 'Hilfe',
  'intro.title': 'Willkommen in deiner Pixel Portfolio World',
  'intro.body': 'Du spawnst als Charakter in einer Pokemon-like Stadt. Erkunde Haeuser, NPCs, Schilder und entdecke Links zu LinkedIn, GitHub, Firma und Projekten.',
  'intro.desktopTitle': 'Desktop',
  'intro.desktopMove': 'Bewegung: WASD oder Pfeiltasten',
  'intro.desktopInteract': 'Interaktion: E, Enter, Space oder Mausklick',
  'intro.mobileTitle': 'Mobile',
  'intro.mobileMove': 'Nutze das D-Pad unten links',
  'intro.mobileInteract': 'Mit Interact unten rechts sprichst du mit NPCs und betrittst Haeuser',
  'intro.startButton': 'Spiel starten',
  'confirm.cancel': 'Zurueck',
  'confirm.proceed': 'OK, weiter',
  'entry.close': 'Schliessen',
  'entry.status.live': 'Live',
  'entry.status.wip': 'In Produktion',
  'entry.status.coming_soon': 'Coming Soon',
  'entry.status.ruins': 'Ruine',
  'scene.hint.default': 'Folge den Wegen, nutze Bruecken ueber Wasser und druecke E / Enter / Space.',
  'scene.hint.prefix': 'Interaktion:',
} as const

export type UITextKey = keyof typeof UI_TEXT_DEFAULTS

export function getUIText(key: UITextKey, overrides?: UITextOverrides): string {
  return overrides?.[key] ?? UI_TEXT_DEFAULTS[key]
}
