import type { BookingJson } from "@shared/booking";

export type BriefLang = "en" | "ms" | "zh";

type ActivityKind = "water" | "trail" | "general";

const WATER_WORDS = [
  "dive",
  "snorkel",
  "boat",
  "island",
  "kayak",
  "beach",
  "reef",
];
const TRAIL_WORDS = ["hike", "trek", "trail", "park", "jungle", "waterfall"];

function activityKind(activity: string): ActivityKind {
  const lower = activity.toLowerCase();
  if (WATER_WORDS.some((word) => lower.includes(word))) return "water";
  if (TRAIL_WORDS.some((word) => lower.includes(word))) return "trail";
  return "general";
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
        "Wear your life jacket whenever the boat is moving, listen to the boatman, and tell the crew your swimming ability before departure. Drink plenty of water and use sun protection.",
      trail:
        "Wear proper footwear, carry enough water, and stay on marked trails. Start early to avoid afternoon rain and tell someone your plan.",
      general:
        "Carry water and sun protection, and keep valuables secure. Respect local customs and posted site guidance.",
    },
    closing:
      "This is general advisory guidance from Jalan2, not professional safety instruction. Follow official site guidance and any authorized operator you book.",
  },
  ms: {
    intro: (activity, meeting) =>
      `Ini taklimat keselamatan untuk ${activity}. Berkumpul di ${meeting}.`,
    price: (price) =>
      `Sediakan kira-kira ${price} ringgit tunai untuk setiap orang; pengusaha kecil jarang menerima kad.`,
    kind: {
      water:
        "Pakai jaket keselamatan sepanjang bot bergerak, dengar arahan tekong, dan maklumkan tahap renang anda sebelum bertolak. Minum air secukupnya dan lindungi diri daripada panas matahari.",
      trail:
        "Pakai kasut yang sesuai, bawa air secukupnya, dan kekal di laluan bertanda. Mulakan awal untuk mengelakkan hujan petang dan beritahu seseorang rancangan anda.",
      general:
        "Bawa air dan pelindung matahari, dan simpan barang berharga dengan selamat. Hormati adat setempat dan panduan rasmi di lokasi.",
    },
    closing:
      "Ini panduan umum daripada Jalan2, bukan arahan keselamatan profesional. Ikut panduan rasmi lokasi dan arahan mana-mana pengusaha sah yang anda tempah.",
  },
  zh: {
    intro: (activity, meeting) =>
      `这是${activity}的安全提示。集合地点是${meeting}。`,
    price: (price) =>
      `建议每人准备约${price}令吉现金，小型业者可能不接受银行卡。`,
    kind: {
      water:
        "乘船期间请穿好救生衣并听从船员指示。出发前告知船员您的游泳能力，并注意补水和防晒。",
      trail:
        "请穿合适的鞋，携带足够饮用水，并留在有标记的步道上。尽量提早出发以避开午后降雨，并把行程告知亲友。",
      general:
        "请携带饮用水并做好防晒，妥善保管贵重物品。尊重当地习俗，并遵守景点的官方指引。",
    },
    closing:
      "这是Jalan2提供的一般建议，并非专业安全指示。请遵守景点官方指引，以及您所预订的正规业者安排。",
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
  return parts.join(" ");
}
