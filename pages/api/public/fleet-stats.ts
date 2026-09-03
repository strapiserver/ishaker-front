import type { NextApiRequest, NextApiResponse } from "next";
import { getStrapiBaseUrl } from "../../../services/fetchers";

const TTL_MS = 5 * 60 * 1000;

type FleetStatsPayload = Record<string, unknown>;

let cache: { at: number; payload: FleetStatsPayload } | null = null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  res.setHeader(
    "Cache-Control",
    "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
  );

  if (cache && Date.now() - cache.at < TTL_MS) {
    return res.status(200).json(cache.payload);
  }

  try {
    const response = await fetch(`${getStrapiBaseUrl()}/api/statistic`, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Statistic request failed: ${response.status}`);

    const stats = (await response.json())?.data?.attributes?.stats;
    if (!stats || typeof stats !== "object") throw new Error("Empty statistics payload");

    cache = { at: Date.now(), payload: stats as FleetStatsPayload };
    return res.status(200).json(cache.payload);
  } catch (error) {
    console.error("[public/fleet-stats] load failed:", error);
    if (cache) return res.status(200).json(cache.payload);
    return res.status(503).json({ error: "stats_unavailable" });
  }
}
