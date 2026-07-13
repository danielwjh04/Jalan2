import { Router } from "express";
import { ReviewSubmissionSchema } from "@shared/reviews";
import { addReview, getExperienceRecord } from "../store/reviews";

export function reviewsRouter(): Router {
  const router = Router();
  router.get("/experiences/:id", (req, res) => {
    const record = getExperienceRecord(req.params.id);
    if (!record) {
      res.status(404).json({ error: `Unknown experience ${req.params.id}` });
      return;
    }
    res.json(record);
  });
  router.post("/experiences/:id/reviews", (req, res) => {
    const parsed = ReviewSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Review needs a name, visit month, 20 to 1000 characters, and three 1 to 5 ratings",
      });
      return;
    }
    try {
      res.status(201).json(addReview(req.params.id, parsed.data));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(message.startsWith("Unknown experience") ? 404 : 409).json({ error: message });
    }
  });
  return router;
}
