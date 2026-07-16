import type {
  PlanningAgentReportSchema,
  PlanningCheckSchema,
  PlanningDaySchema,
  PlanningHandoffSchema,
  PlanningLegSchema,
  PlanningCritiqueSchema,
  PlanningStaySchema,
} from '@shared/planner';
import type { z } from 'zod';

export type PlanningAgentReport = z.infer<typeof PlanningAgentReportSchema>;
export type PlanningCheck = z.infer<typeof PlanningCheckSchema>;
export type PlanningDay = z.infer<typeof PlanningDaySchema>;
export type PlanningHandoff = z.infer<typeof PlanningHandoffSchema>;
export type PlanningLeg = z.infer<typeof PlanningLegSchema>;
export type PlanningCritique = z.infer<typeof PlanningCritiqueSchema>;
export type PlanningStay = z.infer<typeof PlanningStaySchema>;
