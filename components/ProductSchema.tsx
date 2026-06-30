interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface ProductSchemaProps {
  services: ProductItem[];
}

export default function ProductSchema({ services }: ProductSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": services.map((svc) => ({
      "@type": "Product",
      "@id": `#product-${svc.id}`,
      "name": svc.name,
      "description": svc.description,
      "category": svc.category,
      "offers": {
        "@type": "Offer",
        "price": String(svc.price),
        "priceCurrency": "VND",
        "availability": "https://schema.org/InStock",
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
