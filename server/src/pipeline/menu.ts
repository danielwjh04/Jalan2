import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { MenuJsonSchema, MenuJsonWireSchema, type MenuJson } from '@shared/menu';
import type { Config } from '../config';
import type { Retrieval } from '../adapters/retrieval/types';
import { NotConfiguredError } from '../lib/errors';
import { loadCachedMenu } from '../lib/fixtures';

const MENU_INSTRUCTIONS = [
  'You read one photographed Malaysian kopitiam or hawker menu board.',
  'List only dishes actually visible on the board; never invent items.',
  'price_myr is the printed price only; use null when no price is legible.',
  'name_english is a short plain description a tourist understands.',
  'order_phrase is a natural short Malay or Manglish line to order that dish aloud.',
  'allergens are common-knowledge for a typical recipe and advisory only; use an',
  'empty array when unsure.',
].join(' ');

export interface MenuDeps {
  config: Config;
  openai: OpenAI | null;
  retrieval: Retrieval;
}

export interface MenuProduceResult {
  menu: MenuJson;
  servedFrom: 'live' | 'cache';
}

export async function readMenu(
  client: OpenAI,
  model: string,
  imageBase64: string,
  mimeType: string,
): Promise<MenuJson> {
  const completion = await client.beta.chat.completions.parse({
    model,
    messages: [
      { role: 'system', content: MENU_INSTRUCTIONS },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Read this menu board photo.' },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'high' },
          },
        ],
      },
    ],
    response_format: zodResponseFormat(MenuJsonWireSchema, 'menu_json'),
  });
  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error('Menu readout returned no parsed content');
  const candidate: MenuJson = {
    stall_name: parsed.stall_name,
    dishes: parsed.dishes.map((dish) => ({
      ...dish,
      // The model sometimes returns 0 or negatives as an "unknown" sentinel;
      // keep the menu honest with null instead.
      price_myr: dish.price_myr !== null && dish.price_myr <= 0 ? null : dish.price_myr,
      image_url: null,
    })),
  };
  const validated = MenuJsonSchema.safeParse(candidate);
  if (!validated.success) {
    const problems = validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Menu failed validation: ${problems.join('; ')}`);
  }
  return validated.data;
}

export async function attachDishImages(retrieval: Retrieval, menu: MenuJson): Promise<MenuJson> {
  const dishes = await Promise.all(
    menu.dishes.map(async (dish) => {
      try {
        const results = await retrieval.search(`${dish.name_english} malaysian dish photo`, 3);
        const imageUrl = results.find((result) => result.imageUrl)?.imageUrl ?? null;
        return { ...dish, image_url: dish.image_url ?? imageUrl };
      } catch (error) {
        console.warn(`dish image search failed: ${(error as Error).message}`);
        return dish;
      }
    }),
  );
  return { ...menu, dishes };
}

export async function produceMenu(
  deps: MenuDeps,
  imageBase64: string,
  mimeType: string,
): Promise<MenuProduceResult> {
  if (deps.config.PIPELINE_MODE === 'cached') {
    const cached = loadCachedMenu();
    if (!cached) throw new Error('No cached menu fixture available');
    return { menu: cached, servedFrom: 'cache' };
  }
  try {
    if (!deps.openai) {
      throw new NotConfiguredError('OpenAI', 'Set OPENAI_API_KEY or use PIPELINE_MODE=cached.');
    }
    const menu = await readMenu(deps.openai, deps.config.OPENAI_MENU_MODEL, imageBase64, mimeType);
    return { menu: await attachDishImages(deps.retrieval, menu), servedFrom: 'live' };
  } catch (error) {
    if (deps.config.PIPELINE_MODE === 'live') throw error;
    const cached = loadCachedMenu();
    if (!cached) throw error;
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[menu] live read failed (${reason}); serving cached menu`);
    return { menu: cached, servedFrom: 'cache' };
  }
}
