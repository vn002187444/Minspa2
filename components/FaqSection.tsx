import { createClient } from '@/utils/supabase/server';
import FaqAccordionItem from './FaqAccordionItem';
import FaqSchema from './FaqSchema';
import { Sparkles } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export default async function FaqSection({ category }: { category?: string }) {
  let faqs: FaqItem[] = [];
  try {
    const supabase = await createClient();
    let query = supabase
      .from('faqs')
      .select('id, question, answer')
      .eq('is_active', true);
    if (category) {
      query = query.eq('category', category);
    }
    const { data, error } = await query.order('sort_order');
    if (!error && data) faqs = data;
  } catch {
    // SSR build without env — render empty
  }

  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="scroll-mt-28 md:scroll-mt-24 max-w-3xl mx-auto my-12 px-4">
      <div className="text-center mb-8">
        <Sparkles className="w-6 h-6 text-[#8D6E53] mx-auto mb-2" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-[#3A2E2B] tracking-tight">
          Câu Hỏi Thường Gặp
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Những thắc mắc phổ biến tại Min Nail &amp; Hair
        </p>
      </div>

      <ul className="space-y-2">
        {faqs.map(faq => (
          <FaqAccordionItem key={faq.id} faq={faq} />
        ))}
      </ul>

      <FaqSchema items={faqs} />
    </section>
  );
}
