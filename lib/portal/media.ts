import { getStrapiBaseUrl } from "../../services/fetchers";
import type { PortalMedia } from "../../types/portal";

const absoluteMediaUrl = (url?: string) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${getStrapiBaseUrl()}${url}`;
};

export const getSmallestMediaUrl = (media?: PortalMedia | null) =>
  absoluteMediaUrl(
    media?.formats?.thumbnail?.url ||
      media?.formats?.small?.url ||
      media?.formats?.medium?.url ||
      media?.url,
  );

export const getMediaUrl = (media?: PortalMedia | null) =>
  absoluteMediaUrl(media?.url || getSmallestMediaUrl(media));
