const BOOKING_URL = 'https://online.ktmb.com.my/TimeTable/Search';

const STATIONS: Record<string, string> = {
  'kuala lumpur': 'KL Sentral',
  kl: 'KL Sentral',
  'kl sentral': 'KL Sentral',
  ipoh: 'Ipoh',
  kampar: 'Kampar',
  'batu gajah': 'Batu Gajah',
  'tapah road': 'Tapah Road',
  taiping: 'Taiping',
  'kuala kangsar': 'Kuala Kangsar',
  butterworth: 'Butterworth',
  penang: 'Butterworth',
  'george town': 'Butterworth',
  'alor setar': 'Alor Setar',
  'padang besar': 'Padang Besar',
  'sungai petani': 'Sungai Petani',
  'tanjung malim': 'Tanjung Malim',
  seremban: 'Seremban',
  gemas: 'Gemas',
  segamat: 'Segamat',
  'jb sentral': 'JB Sentral',
  'johor bahru': 'JB Sentral',
};

export interface KtmbRoute {
  url: string;
  originStation: string;
  destinationStation: string;
}

export function findKtmbRoute(origin: string, destination: string): KtmbRoute | null {
  const originStation = stationFor(origin);
  const destinationStation = stationFor(destination);
  if (!originStation || !destinationStation || originStation === destinationStation) return null;
  return { url: BOOKING_URL, originStation, destinationStation };
}

export function stationFor(value: string): string | null {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (STATIONS[normalized]) return STATIONS[normalized];
  const match = Object.entries(STATIONS).find(([alias]) => normalized.includes(alias));
  return match?.[1] ?? null;
}
