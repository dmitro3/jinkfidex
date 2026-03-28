import { Request, Response, NextFunction } from "express";
import { cacheGet, cacheSet } from "../config/redis";
import { env } from "../config/env";

export function withCache(keyFn: (req: Request) => string, ttl: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn(req);

    const cached = await cacheGet(key);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.json(cached);
      return;
    }

    // Monkey-patch res.json to intercept and cache
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode === 200) {
        cacheSet(key, body, ttl).catch(() => {});
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
}

export const shortCache = (keyFn: (req: Request) => string) =>
  withCache(keyFn, env.CACHE_TTL_SHORT);

export const mediumCache = (keyFn: (req: Request) => string) =>
  withCache(keyFn, env.CACHE_TTL_MEDIUM);

export const longCache = (keyFn: (req: Request) => string) =>
  withCache(keyFn, env.CACHE_TTL_LONG);
