import { Router } from "express";
import { discoveryCards } from "../lib/discoveries";

export function discoveriesRouter(): Router {
  const router = Router();
  router.get("/discoveries", (_req, res) => res.json(discoveryCards()));
  return router;
}
