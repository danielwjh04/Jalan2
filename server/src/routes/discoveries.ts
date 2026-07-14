import { Router } from "express";
import { z } from "zod";
import { discoveryCards } from "../lib/discoveries";
import { copyDiscoveryTrip } from "../store/trips";

const CopyRequestSchema = z.object({ clientRequestId: z.string().min(1) });

export function discoveriesRouter(): Router {
  const router = Router();
  router.get("/discoveries", (_req, res) => res.json(discoveryCards()));
  router.post("/discoveries/:id/trips", (req, res) => {
    const parsed = CopyRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Body must include clientRequestId" });
      return;
    }
    try {
      res.status(201).json(copyDiscoveryTrip(req.params.id, parsed.data.clientRequestId));
    } catch (error) {
      res.status(404).json({ error: errorMessage(error) });
    }
  });
  return router;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Could not save discovery";
}
