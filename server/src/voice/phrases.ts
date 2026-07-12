export interface PhraseClip {
  id: string;
  textLocal: string;
  textEnglish: string;
}

// Order-like-a-local clips the tourist plays out loud. Keep ids stable; the
// committed fixture mp3s under fixtures/voice/phrases are named after them.
export const PHRASE_CLIPS: readonly PhraseClip[] = [
  {
    id: 'kopi-o-kosong',
    textLocal: 'Kopi O kosong satu, bang.',
    textEnglish: 'One black coffee, no sugar, please.',
  },
  {
    id: 'teh-c-peng',
    textLocal: 'Teh C peng satu, kurang manis.',
    textEnglish: 'One iced milk tea, less sweet.',
  },
  {
    id: 'tapau',
    textLocal: 'Boleh tapau tak?',
    textEnglish: 'Can I get this to take away?',
  },
  {
    id: 'berapa-ringgit',
    textLocal: 'Berapa ringgit semua ini?',
    textEnglish: 'How much is all of this?',
  },
  {
    id: 'kurang-pedas',
    textLocal: 'Kurang pedas sikit, boleh?',
    textEnglish: 'A little less spicy, please.',
  },
  {
    id: 'sedap',
    textLocal: 'Wah, sedapnya!',
    textEnglish: 'Wow, this is delicious!',
  },
  {
    id: 'terima-kasih',
    textLocal: 'Terima kasih, bos!',
    textEnglish: 'Thank you, boss!',
  },
];
