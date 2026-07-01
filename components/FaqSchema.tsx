interface QAPair {
  question: string;
  answer: string;
}

interface FaqSchemaProps {
  items: QAPair[];
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export default function FaqSchema({ items }: FaqSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": "#faq",
    mainEntity: items.map((qa, i) => ({
      "@type": "Question",
      name: stripHtml(qa.question),
      acceptedAnswer: {
        "@type": "Answer",
        "@id": `#faq-answer-${i + 1}`,
        text: stripHtml(qa.answer),
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
