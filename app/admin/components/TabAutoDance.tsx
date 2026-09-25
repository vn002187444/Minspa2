'use client'

import { useState, useEffect } from 'react'
import { Music2, Clock, CheckCircle2, XCircle, RefreshCw, Play } from 'lucide-react'
import { getAutoDanceConfig, saveAutoDanceConfig, getAutoDanceHistory, triggerCronJob } from '../actions'

export default function TabAutoDance() {
  const [config, setConfig] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [msg, setMsg] = useState<{ type: string; text: string }>({ type: '', text: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [cfg, hist] = await Promise.all([getAutoDanceConfig(), getAutoDanceHistory()])
    setConfig(cfg)
    setHistory(hist)
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg({ type: '', text: '' })
    const res = await saveAutoDanceConfig(config)
    if (res.success) setMsg({ type: 'success', text: 'Đã lưu cấu hình Auto Dance!' })
    else setMsg({ type: 'error', text: 'Lỗi: ' + res.error })
    setSaving(false)
  }

  async function handleTrigger() {
    setTriggering(true)
    setMsg({ type: '', text: '' })
    const res = await triggerCronJob('dance_publish' as any)
    if (res.success) { setMsg({ type: 'success', text: 'Đã kích hoạt! ' + (res.message || 'OK') }); loadData() }
    else setMsg({ type: 'error', text: 'Lỗi: ' + (res.error || res.message || 'Unknown') })
    setTriggering(false)
  }

  const days = ['MON','TUE','WED','THU','FRI','SAT','SUN']

  if (loading) return <div className="p-12 text-center text-gray-400 text-sm">Đang tải...</div>

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-violet-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-1">
          <Music2 className="w-4 h-4 text-violet-500" />
          Cấu hình Auto Dance — Min Dance Studio 💃
        </h3>
        <p className="text-[11px] text-gray-500 font-semibold mb-1">
          Tự động review <span className="text-violet-600 font-bold">minstudio.vn</span> (courses/rooms/news), sinh keywords & đăng bài dance. Cron riêng
          <code className="bg-violet-50 px-1 py-0.5 rounded text-violet-700 ml-1">0 5 * * *</code> (05:00 UTC = 12:00 VN). Kiểm tra <code className="bg-gray-100 px-1 rounded">auto_seo_dance_config</code>.
        </p>
        <p className="text-[11px] text-amber-600 font-medium mb-4">Phân biệt với Auto SEO chung (11:00 VN). Bài dance có <code className="bg-gray-100 px-1 rounded">topic_source=auto_dance</code> và backlink <code className="bg-gray-100 px-1 rounded">minstudio.vn/courses|rooms|news</code>.</p>

        {msg.text && (
          <div className={`p-4 rounded-xl text-sm font-medium mb-4 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-violet-50/60 rounded-2xl border border-violet-100">
            <div className="space-y-0.5">
              <span className="block text-xs font-bold text-gray-800">Bật Auto Dance</span>
              <span className="block text-[10px] text-gray-500 font-semibold">Cho phép cron 12h VN tự đăng bài dance</span>
            </div>
            <button type="button" onClick={() => setConfig({ ...config, enabled: !config.enabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${config.enabled ? 'bg-violet-500' : 'bg-gray-200'}`}>
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${config.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">Ngày trong tuần</label>
              <div className="flex flex-wrap gap-1.5">
                {days.map(d => {
                  const selected = (config.schedule_days || []).includes(d)
                  return (
                    <button key={d} type="button" onClick={() => {
                      const cur = config.schedule_days || []
                      const next = selected ? cur.filter((x: string) => x !== d) : [...cur, d]
                      setConfig({ ...config, schedule_days: next.length ? next : [d] })
                    }} className={`px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${selected ? 'bg-violet-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{d}</button>
                  )
                })}
              </div>
            </div>
            <div>
              <label htmlFor="autodance-hour" className="block text-xs font-bold text-gray-700 mb-1">Giờ VN (0-23) — mặc định 12</label>
              <input id="autodance-hour" type="number" min={0} max={23} value={config.schedule_hour}
                onChange={(e) => setConfig({ ...config, schedule_hour: Number(e.target.value) })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500" />
              <p className="text-[10px] text-gray-400 mt-1">05:00 UTC → 12:00 VN. Khuyên giữ 12 để tránh trùng Auto SEO (11:00 VN).</p>
            </div>
          </div>

          <div>
            <label htmlFor="autodance-pool" className="block text-xs font-bold text-gray-700 mb-1">Topic Pool Dance (mỗi dòng một chủ đề)</label>
            <textarea id="autodance-pool" rows={5} value={(config.topic_pool || []).join('\n')}
              onChange={(e) => setConfig({ ...config, topic_pool: e.target.value.split('\n').filter(Boolean) })}
              placeholder={"lớp nhảy Kpop cho thiếu nhi Lavita Charm\nhọc nhảy Zumba giảm cân tại Thủ Đức\ncombo nhảy + fitness cho dân văn phòng"}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
            <p className="text-[10px] text-gray-400 mt-1">AI sẽ pick ngẫu nhiên 1 topic chưa dùng. Khi cạn &lt;5 sẽ tự refill bằng Gemini. Có thể thêm thủ công.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="px-6 py-3 bg-[#5C4033] hover:bg-[#3A2E2B] text-[#FAF6F0] rounded-xl text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer">
              {saving ? 'Đang lưu...' : 'Lưu Cấu Hình Dance'}
            </button>
            <button type="button" onClick={handleTrigger} disabled={triggering} className="inline-flex items-center gap-1.5 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer">
              <Play className="w-3.5 h-3.5" />{triggering ? 'Đang chạy...' : 'Chạy Ngay (dance)'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Clock className="w-4 h-4 text-violet-500" /> Lịch sử Auto Dance</h3>
          <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer"><RefreshCw className="w-4 h-4" /></button>
        </div>
        {history.length === 0 ? (
          <p className="text-xs text-gray-400 font-semibold py-8 text-center">Chưa có bài dance nào.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-violet-50/50 rounded-xl border border-violet-100">
                <div>
                  <p className="text-xs font-bold text-gray-800">{h.topic}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{h.createdAt ? new Date(h.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  {h.status === 'published' ? <span className="flex items-center gap-1 text-[10px] font-bold text-green-600"><CheckCircle2 className="w-3 h-3" /> Đã đăng</span> : h.status === 'failed' ? <span className="flex items-center gap-1 text-[10px] font-bold text-red-500"><XCircle className="w-3 h-3" /> Thất bại</span> : <span className="text-[10px] font-bold text-yellow-600">{h.status}</span>}
                  {h.blogSlug && <a href={`/blog/${h.blogSlug}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-violet-500 hover:underline font-bold">Xem</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
