import type { NextApiRequest, NextApiResponse } from "next";
import { getStrapiBaseUrl } from "../../../../services/fetchers";

const getOrigin = (req: NextApiRequest) => {
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader || "http";
  return `${proto}://${req.headers.host}`;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const callback = `${getOrigin(req)}/portal/google/callback`;
  const url = `${getStrapiBaseUrl()}/api/connect/google?callback=${encodeURIComponent(callback)}`;
  res.redirect(url);
}
