import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApiSession } from "../../../../lib/admin/auth";
import { requestStrapiRestAsService } from "../../../../services/server/strapiClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!requireAdminApiSession(req, res)) return;
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const translationId = Number(req.body?.translationId);
  const languageId = Number(req.body?.languageId);
  const value = typeof req.body?.value === "string" ? req.body.value : "";
  const status = req.body?.status;
  if (
    !Number.isInteger(translationId) ||
    !Number.isInteger(languageId) ||
    !["draft", "reviewed", "approved"].includes(status)
  ) {
    return res.status(400).json({ error: "invalid_translation_entry" });
  }
  try {
    const existing: any[] = await requestStrapiRestAsService(
      `/api/translation-entries?filters[translation][id][$eq]=${translationId}&filters[language][id][$eq]=${languageId}&pagination[pageSize]=1`,
    );
    if (!value) {
      if (existing[0]) {
        await requestStrapiRestAsService(
          `/api/translation-entries/${existing[0].id}`,
          { method: "DELETE" },
        );
      }
      return res.status(200).json({ entry: null });
    }
    const entry = await requestStrapiRestAsService(
      existing[0]
        ? `/api/translation-entries/${existing[0].id}`
        : "/api/translation-entries",
      {
        method: existing[0] ? "PUT" : "POST",
        body: JSON.stringify({
          data: {
            ...(!existing[0]
              ? { translation: translationId, language: languageId }
              : {}),
            value,
            status,
          },
        }),
      },
    );
    return res.status(200).json({ entry });
  } catch (error) {
    console.error("[admin/translations/entries] save failed:", error);
    return res.status(500).json({ error: "translation_entry_save_failed" });
  }
}
