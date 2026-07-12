import type { BookingJson } from '@shared/booking';

export type BriefLang = 'en' | 'ms';

type ActivityKind = 'water' | 'trail' | 'general';

const WATER_WORDS = ['dive', 'snorkel', 'boat', 'island', 'kayak', 'beach', 'reef'];
const TRAIL_WORDS = ['hike', 'trek', 'trail', 'park', 'jungle', 'waterfall'];

function activityKind(activity: string): ActivityKind {
  const lower = activity.toLowerCase();
  if (WATER_WORDS.some((word) => lower.includes(word))) return 'water';
  if (TRAIL_WORDS.some((word) => lower.includes(word))) return 'trail';
  return 'general';
}

interface BriefLines {
  intro: (activity: string, meeting: string) => string;
  price: (price: number) => string;
  kind: Record<ActivityKind, string>;
  closing: string;
}

const LINES: Record<BriefLang, BriefLines> = {
  en: {
    intro: (activity, meeting) =>
      `Here is your safety brief for ${activity}. Meet at ${meeting}.`,
    price: (price) =>
      `Bring about ${price} ringgit per person in cash; small operators rarely take cards.`,
    kind: {
      water:
        'Wear your life jacket whenever the boat is moving, listen to the boatman, and tell the crew your swimming ability before departure. Drink plenty of water and use sun protection.',
      trail:
        'Wear proper footwear, carry enough water, and stay on marked trails. Start early to avoid afternoon rain and tell someone your plan.',
      general:
        'Carry water and sun protection, and keep valuables secure. Respect local customs and follow the advice of your hosts.',
    },
    closing:
      'This is general advisory guidance from Jalan2, not professional safety instruction. Always follow your operator on the day.',
  },
  ms: {
    intro: (activity, meeting) =>
      `Ini taklimat keselamatan untuk ${activity}. Berkumpul di ${meeting}.`,
    price: (price) =>
      `Sediakan kira-kira ${price} ringgit tunai untuk setiap orang; pengusaha kecil jarang menerima kad.`,
    kind: {
      water:
        'Pakai jaket keselamatan sepanjang bot bergerak, dengar arahan tekong, dan maklumkan tahap renang anda sebelum bertolak. Minum air secukupnya dan lindungi diri daripada panas matahari.',
      trail:
        'Pakai kasut yang sesuai, bawa air secukupnya, dan kekal di laluan bertanda. Mulakan awal untuk mengelakkan hujan petang dan beritahu seseorang rancangan anda.',
      general:
        'Bawa air dan pelindung matahari, dan simpan barang berharga dengan selamat. Hormati adat setempat dan ikut nasihat tuan rumah.',
    },
    closing:
      'Ini panduan umum daripada Jalan2, bukan arahan keselamatan profesional. Sentiasa ikut arahan pengusaha anda pada hari tersebut.',
  },
};

// Deterministic template over evidenced BookingJson fields only. No model call:
// a safety brief must never invent tides, closures, or gear requirements.
export function composeBrief(booking: BookingJson, lang: BriefLang): string {
  const lines = LINES[lang];
  const parts = [lines.intro(booking.activity, booking.meeting_point.name)];
  if (booking.price_myr !== null) parts.push(lines.price(booking.price_myr));
  parts.push(lines.kind[activityKind(booking.activity)]);
  parts.push(lines.closing);
  return parts.join(' ');
}
