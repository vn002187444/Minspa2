interface ArticleSchemaProps {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  baseUrl?: string;
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
}

export default function ArticleSchema({
  title,
  description,
  image,
  datePublished,
  dateModified,
  author,
  baseUrl,
  keywords,
  articleSection,
  wordCount,
}: ArticleSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${baseUrl || ''}#article`,
    headline: title,
    description,
    image,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "Min Nail & Hair",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl || ''}/icons/icon-512.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": baseUrl || '',
    },
  };

  if (keywords && keywords.length > 0) {
    schema.keywords = keywords.join(', ');
  }
  if (articleSection) {
    schema.articleSection = articleSection;
  }
  if (wordCount && wordCount > 0) {
    schema.wordCount = wordCount;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
