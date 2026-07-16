import { z } from 'zod';
import { ImageAttributionSchema } from './media';

export const DishSchema = z.object({
  name_local: z.string().min(1),
  name_english: z.string().min(1),
  reading_confidence: z.enum(['high', 'medium', 'low']),
  image_search_query: z.string().min(1),
  taste_profile: z.string().min(1),
  texture_profile: z.string().min(1),
  spice_level: z.enum(['none', 'mild', 'medium', 'hot', 'unknown']),
  price_myr: z.number().nonnegative().nullable(),
  image_url: z.string().nullable(),
  image_attributions: z.array(ImageAttributionSchema).default([]),
  order_phrase: z.string().min(1),
  allergens: z.array(z.string()),
});

export const MenuJsonSchema = z.object({
  stall_name: z.string().nullable(),
  dishes: z.array(DishSchema).min(1),
});

export type Dish = z.infer<typeof DishSchema>;
export type MenuJson = z.infer<typeof MenuJsonSchema>;

// Relaxed twin for the OpenAI structured-output request, mirroring booking.ts:
// constraints move into .describe() text, and image_url is absent because dish
// photos come from retrieval, never from the model.
export const MenuJsonWireSchema = z.object({
  stall_name: z
    .string()
    .nullable()
    .describe('Stall or shop name only when printed on the board; else null'),
  dishes: z.array(
    z.object({
      name_local: z
        .string()
        .describe('Dish name exactly as written on the menu, e.g. "mee rebus"'),
      name_english: z
        .string()
        .describe('Short plain-English description, e.g. "noodles in sweet-savoury gravy"'),
      reading_confidence: z
        .enum(['high', 'medium', 'low'])
        .describe('Confidence that the dish name was read correctly from the photographed row'),
      image_search_query: z
        .string()
        .describe('Canonical Malaysian dish name for licensed photo search, without adjectives'),
      taste_profile: z
        .string()
        .describe('Short sensory description of how a typical version tastes; do not claim the stall recipe is known'),
      texture_profile: z
        .string()
        .describe('Short description of the typical noodle, broth, and topping textures'),
      spice_level: z
        .enum(['none', 'mild', 'medium', 'hot', 'unknown'])
        .describe('Typical heat level; use unknown when the menu gives no useful clue'),
      price_myr: z
        .number()
        .nullable()
        .describe('Price in MYR only when printed on the board; null otherwise'),
      order_phrase: z
        .string()
        .describe('Natural short Malay or Manglish ordering line a tourist can say aloud'),
      allergens: z
        .array(z.string())
        .describe('Common-knowledge allergens for a typical recipe; empty when unsure'),
    }),
  ),
});

export type MenuJsonWire = z.infer<typeof MenuJsonWireSchema>;
