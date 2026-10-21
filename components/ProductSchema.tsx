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

export default function ProductSchema({ services, logoUrl = 'https://spa.minds.io.vn/icons/icon-512.png' }: ProductSchemaProps) {
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
        "validFrom": `${new Date().getFullYear()}-01-01`,
        "priceValidUntil": `${new Date().getFullYear() + 1}-12-31`,
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "applicableCountry": "VN",
          "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted",
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
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 0,
              "unitCode": "DAY"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 0,
              "unitCode": "DAY"
            }
          },
        },
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
