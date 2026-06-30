import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

export default function BreadcrumbNav({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 md:mb-6">
      <ol className="flex items-center gap-1 text-xs text-stone-500 font-medium flex-wrap">
        <li>
          <Link href="/" className="flex items-center gap-1 hover:text-[#8D6E53] transition-colors">
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only sm:not-sr-only">Trang chủ</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={item.url} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-stone-300" />
            {index === items.length - 1 ? (
              <span className="text-[#8D6E53] font-bold truncate max-w-[200px]" title={item.name}>
                {item.name}
              </span>
            ) : (
              <Link href={item.url} className="hover:text-[#8D6E53] transition-colors truncate max-w-[150px]" title={item.name}>
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
