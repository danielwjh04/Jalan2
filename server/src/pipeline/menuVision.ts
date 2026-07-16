import OpenAI from 'openai';
import sharp from 'sharp';
import { zodResponseFormat } from 'openai/helpers/zod';
import {
  MenuJsonSchema,
  MenuJsonWireSchema,
  type MenuJson,
  type MenuJsonWire,
} from '@shared/menu';
import { cleanQuery, confidence, isDuplicate, isVisibleName } from './menuDedup';

const MENU_INSTRUCTIONS = [
  'You read one panel cropped from a Malaysian kopitiam or hawker menu board.',
  'Inventory every distinct food row that is at least partly legible.',
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
  'Never write the literal word null into a text field.',
].join(' ');

interface MenuPanel {
  imageBase64: string;
  mimeType: string;
  index: number;
  total: number;
  focus: string;
}

export async function readMenu(
  client: OpenAI,
  model: string,
  imageBase64: string,
  mimeType: string,
): Promise<MenuJson> {
  const panels = await buildPanels(imageBase64, mimeType);
  const readings = await Promise.all(
    panels.map((panel) => requestPanel(client, model, panel)),
  );
  return validateMenu(mergePanels(readings));
}

async function buildPanels(imageBase64: string, mimeType: string): Promise<MenuPanel[]> {
  const source = Buffer.from(imageBase64, 'base64');
  const metadata = await sharp(source).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height || width < height * 1.1) {
    return [{ imageBase64, mimeType, index: 1, total: 1, focus: 'the full menu' }];
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
    };
  }));
  return [{
    imageBase64: overview.toString('base64'),
    mimeType: 'image/png',
    index: 1,
    total,
    focus: 'the full menu overview; count every column separately',
  }, ...cropPanels];
}

async function requestPanel(
  client: OpenAI,
  model: string,
  panel: MenuPanel,
): Promise<MenuJsonWire> {
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
  return parsed;
}

function mergePanels(readings: MenuJsonWire[]): MenuJson {
  const dishes: MenuJsonWire['dishes'] = [];
  for (const reading of readings) {
    for (const dish of reading.dishes) {
      if (!isVisibleName(dish)) continue;
      const candidate = { ...dish, image_search_query: cleanQuery(dish) };
      const duplicate = dishes.findIndex((item) => isDuplicate(item, candidate));
      if (duplicate < 0) dishes.push(candidate);
      else if (confidence(candidate) > confidence(dishes[duplicate])) {
        dishes[duplicate] = candidate;
      }
    }
  }
  return {
    stall_name: readings.find((reading) => reading.stall_name)?.stall_name ?? null,
    dishes: dishes.map((dish) => ({
      ...dish,
      price_myr: dish.price_myr !== null && dish.price_myr <= 0 ? null : dish.price_myr,
      image_url: null,
      image_attributions: [],
    })),
  };
}

function validateMenu(candidate: MenuJson): MenuJson {
  const validated = MenuJsonSchema.safeParse(candidate);
  if (validated.success) return validated.data;
  const problems = validated.error.issues.map((issue) => (
    `${issue.path.join('.')}: ${issue.message}`
  ));
  throw new Error(`Menu failed validation: ${problems.join('; ')}`);
}
