import { createClient } from "@/utils/supabase/server";

export default async function AggregateRatingSchema() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("rating");

  if (!data || data.length === 0) return null;

  const totalRating = data.reduce((sum, r) => sum + r.rating, 0);
  const average = totalRating / data.length;

  const schema = {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "@id": "#aggregate-rating",
    "itemReviewed": {
      "@type": "LocalBusiness",
      "@id": "#local-business",
      "name": "Min Nail & Hair",
    },
    "ratingValue": average.toFixed(1),
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": data.length,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
