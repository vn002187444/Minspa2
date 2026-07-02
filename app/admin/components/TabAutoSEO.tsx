'use client'

import { useState, useEffect } from "react";
import { Sparkles, Clock, CheckCircle2, XCircle, RefreshCw, Play, Search } from "lucide-react";
import { getAutoSeoConfig, saveAutoSeoConfig, getAutoSeoHistory, triggerCronJob } from "../actions";

export default function TabAutoSEO() {
  const [config, setConfig] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [researching, setResearching] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [cfg, hist] = await Promise.all([getAutoSeoConfig(), getAutoSeoHistory()]);
    setConfig(cfg);
    setHistory(hist);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    const res = await saveAutoSeoConfig(config);
    if (res.success) {
      setMsg({ type: "success", text: "Đã lưu cấu hình Auto SEO!" });
    } else {
      setMsg({ type: "error", text: "Lỗi: " + res.error });
    }
    setSaving(false);
  }

  async function handleTrigger() {
    setTriggering(true);
    setMsg({ type: "", text: "" });
    const res = await triggerCronJob('seo_publish');
    if (res.success) {
      setMsg({ type: "success", text: "Đã kích hoạt! Kết quả: " + (res.message || 'OK') });
      loadData();
    } else {
      setMsg({ type: "error", text: "Lỗi: " + (res.error || res.message || 'Unknown') });
    }
    setTriggering(false);
  }

  async function handleResearch() {
    setResearching(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch('/api/cron/seo-publish?research=1', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server responded with ${res.status}: ${text.substring(0, 200)}`);
      }
      const data = await res.json();
      setMsg({ type: data.success ? 'success' : 'error', text: data.message || 'OK' });
      loadData();
    } catch (e: unknown) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Network error' });
    }
    setResearching(false);
  }

  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  if (loading) return <div className="p-12 text-center text-gray-400 text-sm">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-pink-500" />
          Cấu hình Auto SEO 🤖
        </h3>
        <p className="text-[11px] text-gray-500 font-semibold mb-6">
          Tự động nghiên cứu, viết và đăng bài SEO hàng tuần bằng Gemini AI. Cron chạy mỗi giờ, hệ thống tự kiểm tra lịch đăng.
        </p>

        {msg.text && (
          <div className={`p-4 rounded-xl text-sm font-medium mb-4 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-150">
            <div className="space-y-0.5">
              <span className="block text-xs font-bold text-gray-800">Bật Auto SEO</span>
              <span className="block text-[10px] text-gray-400 font-semibold">Cho phép hệ thống tự động đăng bài mới</span>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, enabled: !config.enabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.enabled ? 'bg-pink-500' : 'bg-gray-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                config.enabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">Ngày trong tuần</label>
              <div className="flex flex-wrap gap-1.5">
                {days.map(d => {
                  const selected = (config.schedule_days || []).includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        const current = config.schedule_days || [];
                        const next = selected
                          ? current.filter((x: string) => x !== d)
                          : [...current, d];
                        setConfig({ ...config, schedule_days: next.length > 0 ? next : [d] });
                      }}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                        selected
                          ? 'bg-pink-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label htmlFor="autoseo-scheduleHour" className="block text-xs font-bold text-gray-700 mb-1">Giờ (0-23)</label>
              <input
                id="autoseo-scheduleHour"
                type="number"
                min={0}
                max={23}
                value={config.schedule_hour}
                onChange={(e) => setConfig({ ...config, schedule_hour: Number(e.target.value) })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="autoseo-topicPool" className="block text-xs font-bold text-gray-700 mb-1">Topic Pool (mỗi dòng một chủ đề)</label>
            <textarea
              id="autoseo-topicPool"
              rows={5}
              value={(config.topic_pool || []).join('\n')}
              onChange={(e) => setConfig({ ...config, topic_pool: e.target.value.split('\n').filter(Boolean) })}
              placeholder="nail art xu hướng 2026&#10;cách chăm sóc tóc tại nhà&#10;gội đầu dưỡng sinh thảo dược"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1 font-medium">
              Mỗi lần chạy Cron, AI sẽ chọn ngẫu nhiên một chủ đề từ pool này.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#5C4033] hover:bg-[#3A2E2B] text-[#FAF6F0] rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Đang lưu..." : "Lưu Cấu Hình"}
            </button>

            <button
              type="button"
              onClick={handleTrigger}
              disabled={triggering}
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              {triggering ? "Đang chạy..." : "Chạy Ngay"}
            </button>

            <button
              type="button"
              onClick={handleResearch}
              disabled={researching}
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              {researching ? "Đang research..." : "Research Từ Khoá"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-pink-500" />
            Lịch sử Auto Post
          </h3>
          <button
            onClick={loadData}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-gray-400 font-semibold py-8 text-center">Chưa có bài viết tự động nào.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-800">{h.topic}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {h.createdAt ? new Date(h.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {h.status === 'published' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                      <CheckCircle2 className="w-3 h-3" /> Đã đăng
                    </span>
                  ) : h.status === 'failed' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                      <XCircle className="w-3 h-3" /> Thất bại
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-yellow-600">{h.status}</span>
                  )}
                  {h.blogSlug && (
                    <a
                      href={`/blog/${h.blogSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-pink-500 hover:underline font-bold"
                    >
                      Xem
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
