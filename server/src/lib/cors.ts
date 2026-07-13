import type { NextFunction, Request, Response } from "express";

const LOCAL_WEB_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

export function isAllowedDemoOrigin(origin: string | undefined): boolean {
  return origin ? LOCAL_WEB_ORIGIN.test(origin) : false;
}

export function localWebCors(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const origin = req.get("Origin");
  if (!isAllowedDemoOrigin(origin)) {
    next();
    return;
  }
  res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.set("Vary", "Origin");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
}
