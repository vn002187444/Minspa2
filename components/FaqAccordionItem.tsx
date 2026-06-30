'use client'
import { useState } from 'react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export default function FaqAccordionItem({ faq }: { faq: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="border border-[#EADDCD] rounded-xl overflow-hidden bg-white">
      <button
        className="w-full text-left px-4 py-3.5 flex justify-between items-center text-sm font-bold text-[#3A2E2B] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <span>{faq.question}</span>
        <span className={`text-[#8D6E53] transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-4 pb-3.5 text-sm text-gray-600 border-t border-[#EADDCD] pt-3 leading-relaxed">
          {faq.answer}
        </div>
      )}
    </li>
  );
}
