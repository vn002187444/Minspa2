interface QAPair {
  question: string;
  answer: string;
}

interface FaqSchemaProps {
  items: QAPair[];
}

export default function FaqSchema({ items }: FaqSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": "#faq",
    mainEntity: items.map((qa, i) => ({
      "@type": "Question",
      "@id": `#faq-question-${i + 1}`,
      name: qa.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: qa.answer,
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
