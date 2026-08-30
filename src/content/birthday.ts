// Birthday easter egg for Alma.
// The cute_girl NPC asks for a secret word; the right one opens the gift page.

import type { LocalizedText } from './types'

export interface BirthdayGift {
  id: string
  image: string
  imageAlt: string
  title: LocalizedText
  body: LocalizedText
  href?: string
  linkLabel?: LocalizedText
}

export const birthdayConfig = {
  npcId: 'cute_girl',
  secretWord: 'ilybebs',
  storageKey: 'alma-birthday-unlocked',
  inputPlaceholder: { en: 'Secret word...', de: 'Geheimwort...' } as LocalizedText,
  submitLabel: { en: 'Tell her', de: 'Verraten' } as LocalizedText,
  wrongCode: {
    en: "Hmm, that's not the word. Better check with Leo again.",
    de: 'Hmm, das ist nicht das richtige Wort. Frag am besten nochmal bei Leo nach.',
  } as LocalizedText,
  unlockedHint: {
    en: 'You already know the secret. Want to see your present again?',
    de: 'Du kennst das Geheimnis ja schon. Willst du dein Geschenk nochmal sehen?',
  } as LocalizedText,
  openAgainLabel: { en: 'Show my present', de: 'Geschenk anzeigen' } as LocalizedText,
  title: {
    en: 'Happy Birthday, Alma!',
    de: 'Alles Gute zum Geburtstag, Alma!',
  } as LocalizedText,
  intro: {
    en: 'No box, no wrapping paper. Instead you get a whole day, just the two of us, in your new city.',
    de: 'Kein Karton, kein Geschenkpapier. Dafür bekommst du einen ganzen Tag, nur wir zwei, in deiner neuen Stadt.',
  } as LocalizedText,
  outro: {
    en: "Valid any time. Can't wait, bebs.",
    de: 'Einlösbar jederzeit. Ich freu mich auf dich, bebs.',
  } as LocalizedText,
  signature: { en: '– Leo', de: '– Leo' } as LocalizedText,
  closeLabel: { en: 'Back to town', de: 'Zurück in die Stadt' } as LocalizedText,
}

export const birthdayGifts: BirthdayGift[] = [
  {
    id: 'walking-tour',
    image: '/assets/game/birthday/tour.png',
    imageAlt: 'Pixel art of the Evoluon building in Eindhoven',
    title: { en: 'Walking Tour: Eindhoven', de: 'Walking Tour durch Eindhoven' },
    body: {
      en: 'A walking tour through Eindhoven, just the two of us. An hour and a half with a guide through the center: Catharinakerk, the Blob, hidden corners and the stories behind them. And after that we just keep the day going.',
      de: 'Eine Walking Tour durch Eindhoven, nur wir zwei. Anderthalb Stunden mit Guide durch die Innenstadt: Catharinakerk, der Blob, versteckte Ecken und die Geschichten dahinter. Und danach lassen wir den Tag einfach weiterlaufen.',
    },
    href: 'https://www.getyourguide.com/eindhoven-l32277/eindhoven-15-hour-inner-city-walking-tour-t416790/?ranking_uuid=984f4f8e-baa1-4000-a397-83afd94ef646&q=Eindhoven+Walking+Tour&date_from=2026-09-01&date_to=2026-09-05&adults=2',
    linkLabel: { en: 'View the tour', de: 'Tour ansehen' },
  },
  {
    id: 'dinner',
    image: '/assets/game/birthday/dinner.png',
    imageAlt: 'Pixel art of a candlelit dinner table for two',
    title: { en: 'Dinner Date', de: 'Abendessen' },
    body: {
      en: 'In the evening we go out for dinner, wherever you feel like. You pick the place, we take our time <3',
      de: 'Abends gehen wir schön essen, worauf du Lust hast. Du suchst den Ort aus, wir lassen uns Zeit mein spatz <3.',
    },
  },
]
