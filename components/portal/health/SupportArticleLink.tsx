import { Button, Skeleton } from "@chakra-ui/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiExternalLink } from "react-icons/fi";

export function SupportArticleLink({ topic }: { topic: "wifi" | "nayax" }) {
  const [article, setArticle] = useState<{ code: string; title: string } | null>();

  useEffect(() => {
    let active = true;
    void fetch(`/api/portal/support-articles?topic=${topic}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (active) setArticle(payload?.article || null);
      })
      .catch(() => {
        if (active) setArticle(null);
      });
    return () => {
      active = false;
    };
  }, [topic]);

  if (article === undefined) return <Skeleton h="40px" borderRadius="md" />;
  if (!article) {
    return (
      <Button as={Link} href="/articles" variant="outline" rightIcon={<FiExternalLink />}>
        Browse support articles
      </Button>
    );
  }
  return (
    <Button
      as={Link}
      href={`/articles/${encodeURIComponent(article.code.toLowerCase())}`}
      variant="outline"
      rightIcon={<FiExternalLink />}
    >
      {article.title}
    </Button>
  );
}
