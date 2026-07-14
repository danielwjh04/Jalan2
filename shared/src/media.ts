import { z } from "zod";

export const ImageAttributionSchema = z.object({
  label: z.string().min(1),
  source_url: z.string().url(),
  license: z.string().min(1).nullable(),
});

export type ImageAttribution = z.infer<typeof ImageAttributionSchema>;
