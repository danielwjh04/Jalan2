import OpenAI from 'openai';
import sharp from 'sharp';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import {
  MenuBoundingBoxSchema,
  MenuJsonSchema,
  MenuJsonWireSchema,
  type MenuJson,
  type MenuJsonWire,
} from '@shared/menu';
import { cleanQuery, confidence, isDuplicate, isVisibleName } from './menuDedup';

const MENU_INSTRUCTIONS = [
  'You read one panel cropped from a Malaysian kopitiam or hawker menu board.',
  'Inventory every distinct food row that is at least partly legible.',
  'For every dish, return one tight source_bbox around the full row: printed Chinese name plus its handwritten translation when present.',
  'source_bbox uses integer coordinates from 0 to 999 relative to this exact input panel, with top-left origin. Ensure x_min < x_max and y_min < y_max.',
  'Scan top to bottom. Never silently drop a row because handwriting is uncertain.',
  'A bold printed name and smaller handwritten translation beside it are one row.',
  'Use the handwriting to interpret the dish, but never count it as a second dish.',
  'When a crop edge shows only a translation from the neighbouring column, ignore it.',
  'Unusual names such as 老鼠粉 are legitimate noodle dishes; do not censor them.',
  'A top row printed 猪杂汤 is pork offal soup when it is visible.',
  'A bottom row handwritten as Yee Mee Basah is also a dish when it is visible.',
  'Keep uncertain rows, transcribe the clearest visible name, and mark confidence low.',
  'List only dishes visible in this panel; never invent items or merge rows.',
  'Ignore punctuation, price headers, logos, and standalone marks that are not food names.',
  'Use the printed price only; use null when its scope or digits are unclear.',
  'Describe a typical version without claiming this stall uses an exact recipe.',
  'Allergens are advisory. Use an empty array when unsure.',
  'image_search_query is a canonical Malaysian dish name for licensed photo search.',
  'Keep regional noodle identities separate. 伊面 or 伊府面 is yee mee: pre-fried egg noodles. 手工面 means handmade wheat noodles and is usually ban mian-style in this context, never yee mee.',
  '福建面 is region-sensitive: Kuala Lumpur Hokkien mee is dark soy wok-fried, while Penang Hokkien mee is prawn noodle soup. Do not use the Singapore pale fried-noodle style unless the menu explicitly says Singapore.',
  'Never write the literal word null into a text field.',
].join(' ');

const RowLocalizationSchema = z.object({
  rows: z.array(z.object({
    dish_index: z.number().int().nonnegative(),
    source_bbox: MenuBoundingBoxSchema,
    confidence: z.enum(['high', 'medium', 'low']),
    visible_text: z.string(),
  })),
});

const LOCALIZATION_INSTRUCTIONS = [
  'You localize already-identified dish rows in one enlarged column of a Malaysian menu board.',
  'Locate only the requested dish names. Ignore the shop title, prices, food photo, and neighbouring columns.',
  'Each box must tightly cover the complete row: printed Chinese name plus its handwritten translation when present.',
  'Use integer 0..999 coordinates relative to this exact column image, top-left origin.',
  'The requested dishes are listed in top-to-bottom order. Return one row for every visible requested dish and preserve its dish_index.',
  'Do not guess a box for text that is not visible in this column.',
].join(' ');

interface MenuPanel {
  imageBase64: string;
  mimeType: string;
  index: number;
  total: number;
  focus: string;
  bounds: { left: number; top: number; width: number; height: number };
  sourceWidth: number;
  sourceHeight: number;
}

interface PanelReading {
  menu: MenuJsonWire;
  panel: MenuPanel;
}

export async function readMenu(
  client: OpenAI,
  model: string,
  imageBase64: string,
  mimeType: string,
  localizationModel = 'gpt-5.6',
): Promise<MenuJson> {
  const panels = await buildPanels(imageBase64, mimeType);
  const readings = await Promise.all(
    panels.map((panel) => requestPanel(client, model, panel)),
  );
  const merged = validateMenu(mergePanels(readings));
  return validateMenu(await refineMenuRowBoxes(
    client,
    localizationModel,
    sourceBuffer(imageBase64),
    merged,
  ));
}

function sourceBuffer(imageBase64: string): Buffer {
  return Buffer.from(imageBase64, 'base64');
}

async function buildPanels(imageBase64: string, mimeType: string): Promise<MenuPanel[]> {
  const source = sourceBuffer(imageBase64);
  const metadata = await sharp(source).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height || width < height * 1.1) {
    return [{
      imageBase64,
      mimeType,
      index: 1,
      total: 1,
      focus: 'the full menu',
      bounds: { left: 0, top: 0, width, height },
      sourceWidth: width,
      sourceHeight: height,
    }];
  }
  const columns = [
    { left: 0, right: Math.round(width * 0.39) },
    { left: Math.round(width * 0.39), right: Math.round(width * 0.68) },
    { left: Math.round(width * 0.68), right: width },
  ];
  const lowerStart = Math.round(height * 0.42);
  const horizontal = [
    { top: 0, height: Math.round(height * 0.58) },
    { top: lowerStart, height: height - lowerStart },
    { top: Math.round(height * 0.62), height: height - Math.round(height * 0.62) },
  ];
  const crops = columns.flatMap((column, columnIndex) => (
    horizontal.map((segment, rowIndex) => ({ ...column, ...segment, columnIndex, rowIndex }))
  ));
  const total = crops.length + 1;
  const overview = await sharp(source).resize({ width: Math.max(1800, width * 2) }).sharpen().png().toBuffer();
  const cropPanels = await Promise.all(crops.map(async (crop, index) => {
    const cropWidth = crop.right - crop.left;
    return {
      imageBase64: (await sharp(source)
      .extract({ left: crop.left, top: crop.top, width: cropWidth, height: crop.height })
      .resize({ width: cropWidth * 3 })
      .sharpen()
      .png()
      .toBuffer()).toString('base64'),
      mimeType: 'image/png',
      index: index + 2,
      total,
      focus: `column ${crop.columnIndex + 1}, section ${crop.rowIndex + 1}`,
      bounds: { left: crop.left, top: crop.top, width: cropWidth, height: crop.height },
      sourceWidth: width,
      sourceHeight: height,
    };
  }));
  return [{
    imageBase64: overview.toString('base64'),
    mimeType: 'image/png',
    index: 1,
    total,
    focus: 'the full menu overview; count every column separately',
    bounds: { left: 0, top: 0, width, height },
    sourceWidth: width,
    sourceHeight: height,
  }, ...cropPanels];
}

async function refineMenuRowBoxes(
  client: OpenAI,
  model: string,
  source: Buffer,
  menu: MenuJson,
): Promise<MenuJson> {
  const metadata = await sharp(source).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) return menu;
  const columns = [
    { left: 0, right: Math.round(width * 0.39), minX: 0, maxX: 390 },
    { left: Math.round(width * 0.39), right: Math.round(width * 0.68), minX: 390, maxX: 680 },
    { left: Math.round(width * 0.68), right: width, minX: 680, maxX: 1000 },
  ];
  const localizationRuns = await Promise.allSettled(columns.map(async (column) => {
    const dishIndexes = menu.dishes
      .map((dish, index) => ({ index, center: (dish.source_bbox.x_min + dish.source_bbox.x_max) / 2 }))
      .filter(({ center }) => center >= column.minX && center < column.maxX)
      .map(({ index }) => index);
    if (dishIndexes.length === 0) return [];
    const cropWidth = column.right - column.left;
    const imageBase64 = (await sharp(source)
      .extract({ left: column.left, top: 0, width: cropWidth, height })
      .resize({ width: cropWidth * 3 })
      .sharpen()
      .png()
      .toBuffer()).toString('base64');
    const completion = await client.beta.chat.completions.parse({
      model,
      messages: [
        { role: 'system', content: LOCALIZATION_INSTRUCTIONS },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                'Locate these rows:',
                ...dishIndexes.map((index) => `${index}: ${menu.dishes[index].name_local}`),
              ].join('\n'),
            },
            {
              type: 'image_url',
              // openai@4.56 predates the newer `original` type, but the API and
              // GPT-5.6 accept it and preserve tiny handwritten menu detail.
              image_url: { url: `data:image/png;base64,${imageBase64}`, detail: 'original' as 'high' },
            },
          ],
        },
      ],
      response_format: zodResponseFormat(RowLocalizationSchema, 'menu_row_localization'),
    });
    const rows = completion.choices[0]?.message.parsed?.rows ?? [];
    const requested = new Set(dishIndexes);
    return rows
      .filter((row) => requested.has(row.dish_index) && row.confidence !== 'low')
      .map((row) => ({
        dishIndex: row.dish_index,
        box: mapPanelBoxToSource(
          row.source_bbox,
          { left: column.left, top: 0, width: cropWidth, height },
          width,
          height,
        ),
      }));
  }));
  const localized = localizationRuns.flatMap((run) => (
    run.status === 'fulfilled' ? run.value : []
  ));
  const replacements = new Map(localized.map((item) => [item.dishIndex, item.box]));
  return {
    ...menu,
    dishes: menu.dishes.map((dish, index) => ({
      ...dish,
      source_bbox: replacements.get(index) ?? dish.source_bbox,
    })),
  };
}

async function requestPanel(
  client: OpenAI,
  model: string,
  panel: MenuPanel,
): Promise<PanelReading> {
  const completion = await client.beta.chat.completions.parse({
    model,
    messages: [
      { role: 'system', content: MENU_INSTRUCTIONS },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Read panel ${panel.index} of ${panel.total}, focused on ${panel.focus}. Scan from the top edge and include the bottommost visible food row.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${panel.mimeType};base64,${panel.imageBase64}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
    response_format: zodResponseFormat(MenuJsonWireSchema, 'menu_json'),
  });
  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error(`Menu panel ${panel.index} returned no parsed content`);
  return { menu: parsed, panel };
}

function mergePanels(readings: PanelReading[]): MenuJson {
  const dishes: Array<{ dish: MenuJsonWire['dishes'][number]; panelIndex: number }> = [];
  for (const reading of readings) {
    for (const dish of reading.menu.dishes) {
      if (!isVisibleName(dish)) continue;
      const candidate = groundMalaysianDish({
        ...dish,
        image_search_query: cleanQuery(dish),
        source_bbox: mapPanelBoxToSource(
          dish.source_bbox,
          reading.panel.bounds,
          reading.panel.sourceWidth,
          reading.panel.sourceHeight,
        ),
      });
      const duplicate = dishes.findIndex((item) => isDuplicate(item.dish, candidate));
      if (duplicate < 0) dishes.push({ dish: candidate, panelIndex: reading.panel.index });
      else {
        const existing = dishes[duplicate];
        const candidateIsCrop = reading.panel.index > 1;
        const existingIsOverview = existing.panelIndex === 1;
        const sameLocalizationTier = candidateIsCrop === (existing.panelIndex > 1);
        if (confidence(candidate) > confidence(existing.dish)
          || (candidateIsCrop && existingIsOverview)
          || (confidence(candidate) === confidence(existing.dish)
            && sameLocalizationTier
            && boxArea(candidate.source_bbox) < boxArea(existing.dish.source_bbox))) {
          dishes[duplicate] = { dish: candidate, panelIndex: reading.panel.index };
        }
      }
    }
  }
  return {
    stall_name: readings.find((reading) => reading.menu.stall_name)?.menu.stall_name ?? null,
    dishes: dishes.map(({ dish }) => ({
      ...dish,
      price_myr: dish.price_myr !== null && dish.price_myr <= 0 ? null : dish.price_myr,
      image_url: null,
      image_attributions: [],
    })),
  };
}

export function mapPanelBoxToSource(
  box: MenuJsonWire['dishes'][number]['source_bbox'],
  bounds: MenuPanel['bounds'],
  sourceWidth: number,
  sourceHeight: number,
): MenuJsonWire['dishes'][number]['source_bbox'] {
  const x = (value: number) => Math.round(
    ((bounds.left + (value / 999) * bounds.width) / sourceWidth) * 999,
  );
  const y = (value: number) => Math.round(
    ((bounds.top + (value / 999) * bounds.height) / sourceHeight) * 999,
  );
  return {
    x_min: clamp(x(Math.min(box.x_min, box.x_max - 1))),
    y_min: clamp(y(Math.min(box.y_min, box.y_max - 1))),
    x_max: clamp(x(Math.max(box.x_max, box.x_min + 1))),
    y_max: clamp(y(Math.max(box.y_max, box.y_min + 1))),
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(999, value));
}

function boxArea(box: MenuJsonWire['dishes'][number]['source_bbox']): number {
  return Math.max(1, box.x_max - box.x_min) * Math.max(1, box.y_max - box.y_min);
}

export function groundMalaysianDish(dish: MenuJsonWire['dishes'][number]): MenuJsonWire['dishes'][number] {
  const identity = `${dish.name_local} ${dish.name_english} ${dish.image_search_query}`.toLowerCase();
  if (dish.name_local.includes('手工面')) {
    return {
      ...dish,
      name_english: 'Handmade ban mian-style noodle soup',
      image_search_query: 'Malaysian ban mian soup handmade wheat noodles',
    };
  }
  if (dish.name_local.includes('伊面')) {
    const wet = /basah|wet|gravy/.test(identity);
    return {
      ...dish,
      name_english: wet
        ? 'Wet-style fried yee mee egg noodles'
        : 'Fried yee mee egg noodles, usually served in soup or gravy',
      image_search_query: wet
        ? 'Malaysian yee mee basah fried egg noodles gravy'
        : 'Malaysian yee mee soup fried egg noodle cake',
    };
  }
  if (dish.name_local.includes('福建面')) {
    if (/penang|prawn|shrimp|虾|湯|汤|soup/.test(identity)) {
      return { ...dish, image_search_query: 'Penang Malaysian Hokkien prawn mee soup' };
    }
    if (/kuala lumpur|\bkl\b|dark|black|soy|wok|fried/.test(identity)) {
      return { ...dish, image_search_query: 'Kuala Lumpur dark soy Hokkien mee' };
    }
    return {
      ...dish,
      reading_confidence: 'low',
      image_search_query: 'Malaysian Hokkien mee regional style uncertain',
    };
  }
  return dish;
}

function validateMenu(candidate: MenuJson): MenuJson {
  const validated = MenuJsonSchema.safeParse(candidate);
  if (validated.success) return validated.data;
  const problems = validated.error.issues.map((issue) => (
    `${issue.path.join('.')}: ${issue.message}`
  ));
  throw new Error(`Menu failed validation: ${problems.join('; ')}`);
}
