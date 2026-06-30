"use client";
import { useEffect, useState } from 'react';
import { ToggleLeft, ToggleRight } from "lucide-react";
import {
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
} from '../actions';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

const CATEGORIES = ['general', 'service', 'policy', 'booking', 'package', 'payment'];

export default function TabFAQ() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'general' });
  const [editing, setEditing] = useState<Faq | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    (async () => setFaqs(await getFaqs()))();
  }, []);

  const handleAdd = async () => {
    await createFaq(newFaq);
    setFaqs(await getFaqs());
    setNewFaq({ question: '', answer: '', category: 'general' });
  };

  const handleUpdate = async (id: string) => {
    if (!editing) return;
    const { id: _unused, ...cleanUpdates } = editing;
    await updateFaq(id, cleanUpdates);
    setFaqs(await getFaqs());
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await deleteFaq(id);
    setFaqs(faqs.filter(f => f.id !== id));
  };

  const handleToggleActive = async (faq: Faq) => {
    await updateFaq(faq.id, { ...faq, is_active: !faq.is_active });
    setFaqs(await getFaqs());
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...faqs];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setFaqs(newOrder);
    await reorderFaqs(newOrder.map(f => f.id));
  };

  const moveDown = async (index: number) => {
    if (index === faqs.length - 1) return;
    const newOrder = [...faqs];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setFaqs(newOrder);
    await reorderFaqs(newOrder.map(f => f.id));
  };

  const filteredFaqs = categoryFilter === 'all'
    ? faqs
    : faqs.filter(f => f.category === categoryFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 font-display">Quản lý Câu Hỏi Thường Gặp</h2>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent outline-none bg-white min-w-[180px]"
        >
          <option value="all">Tất cả danh mục</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl">
        <input
          placeholder="Câu hỏi"
          value={newFaq.question}
          onChange={e => setNewFaq({ ...newFaq, question: e.target.value })}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent outline-none"
        />
        <input
          placeholder="Trả lời"
          value={newFaq.answer}
          onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent outline-none"
        />
        <select
          value={newFaq.category}
          onChange={e => setNewFaq({ ...newFaq, category: e.target.value })}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent outline-none bg-white"
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          className="bg-[#8D6E53] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#5C4033] transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          Thêm FAQ
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {filteredFaqs.map((faq, index) => (
            <li key={faq.id} className="p-4 hover:bg-gray-50/50 transition-colors">
              {editing?.id === faq.id ? (
                <div className="space-y-3">
                  <input
                    defaultValue={faq.question}
                    onChange={e => setEditing({ ...faq, question: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent outline-none"
                    placeholder="Câu hỏi"
                  />
                  <textarea
                    defaultValue={faq.answer}
                    onChange={e => setEditing({ ...faq, answer: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent outline-none resize-none"
                    placeholder="Trả lời"
                    rows={2}
                  />
                  <select
                    value={faq.category}
                    onChange={e => setEditing({ ...faq, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent outline-none bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleUpdate(faq.id)}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Huỷ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <strong className="text-gray-900 text-sm">{faq.question}</strong>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{faq.answer}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-gray-100 text-gray-600 uppercase tracking-wider">
                        {faq.category}
                      </span>
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1"
                        style={{
                          backgroundColor: faq.is_active ? '#dcfce7' : '#fee2e2',
                          color: faq.is_active ? '#166534' : '#991b1b'
                        }}
                      >
                        {faq.is_active ? (
                          <>
                            <ToggleRight className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">#{faq.sort_order}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleActive(faq)}
                      className={`p-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        faq.is_active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                      title={faq.is_active ? "Ẩn FAQ này" : "Hiện FAQ này"}
                    >
                      {faq.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {faq.is_active ? 'Ẩn' : 'Hiện'}
                    </button>
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-gray-100 hover:bg-gray-200"
                      title="Lên trên"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === filteredFaqs.length - 1}
                      className="p-1.5 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-gray-100 hover:bg-gray-200"
                      title="Xuống dưới"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => setEditing(faq)}
                      className="px-3 py-2.5 min-h-[44px] bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors cursor-pointer"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="px-3 py-2.5 min-h-[44px] bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {filteredFaqs.length === 0 && (
            <li className="p-8 text-center">
              <p className="text-gray-400 text-sm">Không có FAQ nào{categoryFilter !== 'all' ? ` trong danh mục "${categoryFilter}"` : ''}.</p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}