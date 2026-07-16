import type { MenuJsonWire } from '@shared/menu';

type WireDish = MenuJsonWire['dishes'][number];

export function isVisibleName(dish: WireDish): boolean {
  if (!normalise(dish.name_local)) return false;
  const combined = `${dish.name_local} ${dish.name_english}`.toLowerCase();
  return !['unknown', 'unidentified', 'null', '未识别'].some((word) => combined.includes(word));
}

export function isDuplicate(first: WireDish, second: WireDish): boolean {
  const firstName = normalise(first.name_local);
  const secondName = normalise(second.name_local);
  if (firstName === secondName) return true;
  if (hasWetStyle(first) !== hasWetStyle(second)) return false;
  if (hasChinese(first.name_local) && hasChinese(second.name_local)) {
    const firstChinese = chineseOnly(first.name_local);
    const secondChinese = chineseOnly(second.name_local);
    if (containsName(firstChinese, secondChinese) || oneCharacterApart(firstChinese, secondChinese)) return true;
  }
  if (hasChinese(first.name_local) !== hasChinese(second.name_local)
    && sameSpecificDish(first.name_english, second.name_english)) return true;
  if (sameTransliteration(first.name_local, second.name_local)) return true;
  const query = normalise(first.image_search_query);
  if (query !== normalise(second.image_search_query)) return false;
  if (!['noodles', 'friednoodles', 'noodlesoup'].includes(query)) return true;
  const firstWords = words(first.name_english);
  const secondWords = words(second.name_english);
  const shared = firstWords.filter((word) => secondWords.includes(word)).length;
  return shared / Math.max(firstWords.length, secondWords.length) >= 0.5;
}

function hasWetStyle(dish: WireDish): boolean {
  return /\b(?:basah|wet)\b/i.test(`${dish.name_local} ${dish.name_english} ${dish.image_search_query}`);
}

export function cleanQuery(dish: WireDish): string {
  const query = dish.image_search_query.trim();
  return ['null', 'unknown', 'n/a'].includes(query.toLowerCase()) ? dish.name_english : query;
}

export function confidence(dish: WireDish): number {
  return { high: 3, medium: 2, low: 1 }[dish.reading_confidence];
}

function containsName(first: string, second: string): boolean {
  return first.startsWith(second) || second.startsWith(first) || first.endsWith(second) || second.endsWith(first);
}

function chineseOnly(value: string): string {
  return [...value].filter((character) => /[\u3400-\u9fff]/u.test(character)).join('');
}

function oneCharacterApart(first: string, second: string): boolean {
  if (first.length < 3 || first.length !== second.length) return false;
  return [...first].filter((character, index) => character !== [...second][index]).length <= 1;
}

function sameTransliteration(first: string, second: string): boolean {
  const left = asciiWords(first);
  const right = asciiWords(second);
  if (left.length === 0 || right.length === 0) return false;
  const union = new Set([...left, ...right]);
  const shared = left.filter((word) => right.includes(word)).length;
  return shared / union.size >= 0.8;
}

function asciiWords(value: string): string[] {
  return [...new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 1))];
}

function hasChinese(value: string): boolean {
  return /[\u3400-\u9fff]/u.test(value);
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

function words(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2);
}

function sameSpecificDish(first: string, second: string): boolean {
  const generic = new Set([
    'and', 'dish', 'food', 'fried', 'malaysian', 'noodle', 'noodles',
    'soup', 'style', 'the', 'with',
  ]);
  const left = words(first).filter((word) => !generic.has(word));
  const right = words(second).filter((word) => !generic.has(word));
  if (Math.min(left.length, right.length) < 2) return false;
  const shared = left.filter((word) => right.includes(word)).length;
  return shared / Math.max(left.length, right.length) >= 0.8;
}
