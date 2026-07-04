interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface ProductSchemaProps {
  services: ProductItem[];
  logoUrl?: string;
}

export default function ProductSchema({ services, logoUrl = 'https://minhair.vercel.app/icons/icon-512.png' }: ProductSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": services.map((svc) => ({
      "@type": "Product",
      "@id": `#product-${svc.id}`,
      "name": svc.name,
      "description": svc.description,
      "category": svc.category,
      "image": logoUrl,
      "brand": {
        "@type": "Brand",
        "name": "Min Nail & Hair",
      },
      "offers": {
        "@type": "Offer",
        "price": String(svc.price),
        "priceCurrency": "VND",
        "availability": "https://schema.org/InStock",
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "applicableTo": "Product",
          "returnPolicy: laout": "No returns for services",
          "merchantReturnDays": 0,
          "returnMethod": "https://schema.org/ReturnByMail",
          "returnFees": "https://schema.org/FreeReturn",
        },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": 0,
            "currency": "VND",
            "unitText": "Free",
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": "VN",
          },
        },
      },
      "aggregateRating": {
        "@id": "#aggregate-rating",
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
