interface WebSiteSchemaProps {
  baseUrl: string;
}

export default function WebSiteSchema({ baseUrl }: WebSiteSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "#website",
    url: baseUrl,
    name: "Min Nail & Hair",
    publisher: { "@id": "#local-business" },
    image: {
      "@type": "ImageObject",
      url: `${baseUrl}/icons/icon-512.png`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
