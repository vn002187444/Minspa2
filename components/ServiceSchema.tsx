interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  category: string;
}

interface ServiceSchemaProps {
  services: ServiceItem[];
  logoUrl?: string;
}

export default function ServiceSchema({ services, logoUrl = 'https://spa.minds.io.vn/icons/icon-512.png' }: ServiceSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((svc, i) => ({
      "@type": "ListItem",
      "@id": `#service-item-${i + 1}`,
      position: i + 1,
      item: {
        "@type": "Service",
        "@id": `#service-${svc.id}`,
        name: svc.name,
        description: svc.description,
        image: logoUrl,
        brand: {
          "@type": "Brand",
          "name": "Min Nail & Hair",
        },
        offers: {
          "@type": "Offer",
          price: String(svc.price),
          priceCurrency: "VND",
          availability: "https://schema.org/InStock",
          validFrom: `${new Date().getFullYear()}-01-01`,
          priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            "applicableCountry": "VN",
            "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted",
          },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            "shippingRate": {
              "@type": "MonetaryAmount",
              "value": 0,
              "currency": "VND",
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
                "unitCode": "DAY",
              },
              "transitTime": {
                "@type": "QuantitativeValue",
                "minValue": 0,
                "maxValue": 0,
                "unitCode": "DAY",
              },
            },
          },
        },
        category: svc.category,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
}
