interface ReviewItem {
  name: string;
  text: string;
  rating: number;
}

interface ReviewSchemaProps {
  reviews: ReviewItem[];
  baseUrl: string;
}

export default function ReviewSchema({ reviews, baseUrl }: ReviewSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": reviews.map((review, i) => ({
      "@type": "Review",
      "@id": `#review-${i + 1}`,
      name: review.name,
      reviewBody: review.text,
      author: {
        "@type": "Person",
        name: review.name,
      },
      itemReviewed: {
        "@type": "LocalBusiness",
        "@id": `${baseUrl}/#local-business`,
        name: "Min Nail & Hair",
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
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
