"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface ServiceBookButtonProps {
  href: string;
  serviceName: string;
  serviceCategory: string;
}

export default function ServiceBookButton({ href, serviceName, serviceCategory }: ServiceBookButtonProps) {
  return (
    <Link
      href={href}
      onClick={() =>
        trackEvent("view_service", {
          service_name: serviceName,
          service_category: serviceCategory,
        })
      }
      className="px-4 py-2 bg-[#FAF0E6] hover:bg-[#5C4033] hover:text-white text-[#8D6E53] border border-[#EADDCD] text-xs font-bold rounded-full transition-all flex items-center gap-1 uppercase tracking-wider"
    >
      Book <ChevronRight className="w-3 h-3" aria-hidden="true" />
    </Link>
  );
}
