import type { TextToSpeech } from './types';

export function createLanguageRoutingTts(
  primary: TextToSpeech,
  cantonese: TextToSpeech,
): TextToSpeech {
  return {
    name: 'language_router',
    synthesize(request) {
      return request.languageCode === 'yue-HK'
        ? cantonese.synthesize(request)
        : primary.synthesize(request);
    },
  };
}
