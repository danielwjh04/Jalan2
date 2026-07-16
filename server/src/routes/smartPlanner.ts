import { Router } from 'express';
import { SmartPlanRequestSchema } from '@shared/planner';
import type { PlacesProvider } from '../adapters/places/types';
import type { RoutingProvider } from '../adapters/routing/types';
import { createSmartPlan } from '../planner/smartPlanner';
import type { PlanCritic } from '../planner/planCritic';

export function smartPlannerRouter(routing: RoutingProvider, places: PlacesProvider, critic?: PlanCritic): Router {
  const router = Router();
  router.post('/smart-plan', async (req, res) => {
    const parsed = SmartPlanRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues.map((issue) => issue.message).join('; ') });
      return;
    }
    try {
      res.status(201).json(await createSmartPlan(parsed.data, { routing, places, critic }));
    } catch (error) {
      res.status(502).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });
  return router;
}
