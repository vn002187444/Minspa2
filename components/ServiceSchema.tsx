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
}

export default function ServiceSchema({ services }: ServiceSchemaProps) {
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
        offers: {
          "@type": "Offer",
          price: String(svc.price),
          priceCurrency: "VND",
        },
        category: svc.category,
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
