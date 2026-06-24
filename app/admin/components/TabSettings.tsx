"use client";

import { useState } from "react";
import {
  Activity,
  Clock,
  Database,
  Bell,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Palette,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  CloudSun,
} from "lucide-react";
import {
  getSystemHealth,
  triggerCronJob,
  createManualNotification,
  getCronJobStatuses,
  getBannerSettings,
  saveBannerSettings,
  getMascotSettings,
  saveMascotSettings,
  getThemeSettings,
  saveThemeSettings,
  backupDatabase,
} from "../actions";
import { THEME_LIST } from "@/lib/themes";
import { MASCOT_CHARACTERS } from "@/lib/mascot-themes";

export default function TabSettings() {
  const [health, setHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [cronStatuses, setCronStatuses] = useState<any[]>([]);
  const [cronLoading, setCronLoading] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  // Banner
  const [banner, setBanner] = useState<any>(null);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Mascot
  const [mascot, setMascot] = useState<any>(null);
  const [mascotLoading, setMascotLoading] = useState(false);
  const [mascotSaving, setMascotSaving] = useState(false);
  const [mascotMsg, setMascotMsg] = useState<string | null>(null);

  // Theme
  const [theme, setTheme] = useState<any>(null);
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeMsg, setThemeMsg] = useState<string | null>(null);
  const [themePreview, setThemePreview] = useState<string>('default');

  // Backup
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [backupSql, setBackupSql] = useState<string | null>(null);

  // Notification
  const [notifRole, setNotifRole] = useState("STAFF");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifSending, setNotifSending] = useState(false);
  const [notifMsg, setNotifMsg] = useState<string | null>(null);

  const checkHealth = async () => {
    setHealthLoading(true);
    setHealth(await getSystemHealth());
    setHealthLoading(false);
  };

  const loadCronStatuses = async () => {
    setCronLoading(true);
    setCronStatuses(await getCronJobStatuses());
    setCronLoading(false);
  };

  const handleTriggerCron = async (job: "reminders" | "marketing" | "auto_assign") => {
    setCronResult(null);
    const res = await triggerCronJob(job);
    setCronResult(`${job}: ${res.success ? "Thành công" : "Thất bại"}`);
    if (res.success) loadCronStatuses();
  };

  const loadMascot = async () => {
    setMascotLoading(true);
    setMascot(await getMascotSettings());
    setMascotLoading(false);
  };

  const handleSaveMascot = async () => {
    setMascotSaving(true);
    setMascotMsg(null);
    const res = await saveMascotSettings(mascot);
    setMascotMsg(res.success ? "Đã lưu cấu hình Mascot!" : "Lỗi: " + res.error);
    setMascotSaving(false);
  };

  const loadTheme = async () => {
    setThemeLoading(true);
    setTheme(await getThemeSettings());
    setThemeLoading(false);
  };

  const handleSaveTheme = async () => {
    setThemeSaving(true);
    setThemeMsg(null);
    const res = await saveThemeSettings(theme);
    setThemeMsg(res.success ? "Đã lưu theme!" : "Lỗi: " + res.error);
    setThemeSaving(false);
  };

  const loadBanner = async () => {
    setBannerLoading(true);
    setBanner(await getBannerSettings());
    setBannerLoading(false);
  };

  const handleSaveBanner = async () => {
    setBannerSaving(true);
    setBannerMsg(null);
    const res = await saveBannerSettings(banner);
    setBannerMsg(res.success ? "Đã lưu banner thành công!" : "Lỗi: " + res.error);
    setBannerSaving(false);
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    setBackupMsg(null);
    setBackupSql(null);
    const res = await backupDatabase();
    if (res.success) {
      setBackupMsg(`Đã backup ${res.count} bảng thành công!`);
      setBackupSql(res.sql);
    } else {
      setBackupMsg('Lỗi backup: ' + (res as any).error);
    }
    setBackupLoading(false);
  };

  const downloadBackup = () => {
    if (!backupSql) return;
    const blob = new Blob([backupSql], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      setNotifMsg("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }
    setNotifSending(true);
    setNotifMsg(null);
    const res = await createManualNotification(notifRole, notifTitle, notifBody);
    setNotifMsg(res.success ? `Đã gửi cho ${res.count} người dùng!` : "Lỗi: " + res.error);
    setNotifSending(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 font-display">Cấu hình & Hệ thống</h2>
        <p className="text-sm text-gray-500 mt-1">Quản lý các cài đặt nâng cao cho hệ thống</p>
      </div>

      {/* System Health */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">Tình trạng hệ thống</h3>
          </div>
          <button
            onClick={checkHealth}
            disabled={healthLoading}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {healthLoading ? "Đang kiểm tra..." : "Kiểm tra"}
          </button>
        </div>
        {health && (
          <div className={`p-3 rounded-xl text-sm font-medium ${
            health.status === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            <div className="flex items-center gap-2">
              {health.status === "ok" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span>{health.status === "ok" ? "Hệ thống hoạt động bình thường" : "Hệ thống có vấn đề"}</span>
            </div>
            {health.timestamp && (
              <p className="text-xs mt-1 opacity-70">Lần kiểm tra: {new Date(health.timestamp).toLocaleString("vi-VN")}</p>
            )}
            {health.error && <p className="text-xs mt-1 opacity-70">Chi tiết: {health.error}</p>}
          </div>
        )}
      </div>

      {/* Cron Jobs */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">Cron Jobs</h3>
          </div>
          <button
            onClick={loadCronStatuses}
            disabled={cronLoading}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {cronLoading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        {cronResult && (
          <div className="mb-3 p-2 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">{cronResult}</div>
        )}

        <div className="space-y-2">
          {[
            { id: "reminders" as const, label: "Nhắc lịch hẹn", desc: "Gửi nhắc nhở cho khách hàng" },
            { id: "marketing" as const, label: "Marketing", desc: "Gửi tin nhắn marketing tự động" },
            { id: "auto_assign" as const, label: "Tự động phân ca", desc: "Phân công nhân viên tự động" },
          ].map((job) => {
            const status = cronStatuses.find((c) => c.name === job.id);
            return (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{job.label}</p>
                  <p className="text-xs text-gray-500">{job.desc}</p>
                  {status?.lastRun && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Lần cuối: {new Date(status.lastRun.started_at).toLocaleString("vi-VN")}
                      {status.lastRun.success !== undefined && (
                        <span className={status.lastRun.success ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                          ({status.lastRun.success ? "OK" : "Lỗi"})
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleTriggerCron(job.id)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#8D6E53] text-white hover:bg-[#7A5F47] transition-colors"
                >
                  Chạy ngay
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mascot Settings (V3.6) */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">Mascot tương tác</h3>
          </div>
          <button
            onClick={loadMascot}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {mascotLoading ? "Đang tải..." : "Tải"}
          </button>
        </div>

        {mascot && (
          <div className="space-y-4">
            <label htmlFor="settings-mascotEnabled" className="flex items-center gap-2 cursor-pointer">
              <input
                id="settings-mascotEnabled"
                type="checkbox"
                checked={mascot.enabled}
                onChange={(e) => setMascot({ ...mascot, enabled: e.target.checked })}
                className="rounded border-gray-300 text-[#8D6E53] focus:ring-[#8D6E53]"
              />
              <span className="text-sm font-medium text-gray-700">Hiển thị Mascot toàn trang</span>
            </label>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Kiểu nhân vật</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {MASCOT_CHARACTERS.map((char) => (
                  <button
                    key={char.key}
                    type="button"
                    onClick={() => setMascot({ ...mascot, character: char.key })}
                    className={`p-2 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      mascot.character === char.key ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-lg">{char.emoji}</p>
                    <p className="text-[10px] font-bold mt-0.5">{char.label.split(' ')[0]}</p>
                    <p className="text-[9px] text-gray-400">{char.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <label htmlFor="settings-mascotSound" className="flex items-center gap-2 cursor-pointer">
              <input
                id="settings-mascotSound"
                type="checkbox"
                checked={mascot.soundEnabled}
                onChange={(e) => setMascot({ ...mascot, soundEnabled: e.target.checked })}
                className="rounded border-gray-300 text-[#8D6E53] focus:ring-[#8D6E53]"
              />
              {mascot.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-gray-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-sm font-medium text-gray-700">Hiệu ứng âm thanh</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveMascot}
                disabled={mascotSaving}
                className="px-4 py-2 bg-[#8D6E53] text-white rounded-lg text-sm font-semibold hover:bg-[#7A5F47] transition-colors disabled:opacity-50"
              >
                {mascotSaving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
              {mascotMsg && (
                <span className={`text-xs font-medium ${mascotMsg.startsWith("Đã") ? "text-green-600" : "text-red-600"}`}>
                  {mascotMsg}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Theme Settings (V3.8) */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">Theme & Giao diện</h3>
          </div>
          <button
            onClick={loadTheme}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {themeLoading ? "Đang tải..." : "Tải"}
          </button>
        </div>

        {theme && (
          <div className="space-y-4">
            <div>
              <label htmlFor="settings-themeOverride" className="text-xs font-semibold text-gray-500 mb-2 block">Chủ đề</label>
              <select
                id="settings-themeOverride"
                value={theme.override || 'auto'}
                onChange={(e) => {
                  const val = e.target.value;
                  setTheme({ ...theme, override: val === 'auto' ? null : val });
                  setThemePreview(val === 'auto' ? 'default' : val);
                }}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent"
              >
                <option value="auto">🎯 Tự động (theo mùa)</option>
                {THEME_LIST.map((t) => (
                  <option key={t.name} value={t.name}>{t.label} — {t.description}</option>
                ))}
              </select>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200" style={{ backgroundColor: `rgb(var(--color-bg))` }}>
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: `rgb(var(--color-accent))` }} />
              <div className="flex-1 space-y-1">
                <div className="h-2 rounded w-3/4" style={{ backgroundColor: `rgb(var(--color-text-primary))` }} />
                <div className="h-2 rounded w-1/2" style={{ backgroundColor: `rgb(var(--color-text-secondary))` }} />
              </div>
              <div className="w-12 h-6 rounded" style={{ backgroundColor: `rgb(var(--color-gold))` }} />
            </div>

            <label htmlFor="settings-particlesEnabled" className="flex items-center gap-2 cursor-pointer">
              <input
                id="settings-particlesEnabled"
                type="checkbox"
                checked={theme.particlesEnabled}
                onChange={(e) => setTheme({ ...theme, particlesEnabled: e.target.checked })}
                className="rounded border-gray-300 text-[#8D6E53] focus:ring-[#8D6E53]"
              />
              <span className="text-sm font-medium text-gray-700">Hiệu ứng nền (tuyết/lá/hoa)</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveTheme}
                disabled={themeSaving}
                className="px-4 py-2 bg-[#8D6E53] text-white rounded-lg text-sm font-semibold hover:bg-[#7A5F47] transition-colors disabled:opacity-50"
              >
                {themeSaving ? "Đang lưu..." : "Lưu theme"}
              </button>
              {themeMsg && (
                <span className={`text-xs font-medium ${themeMsg.startsWith("Đã") ? "text-green-600" : "text-red-600"}`}>
                  {themeMsg}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Banner Settings */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">Banner quảng cáo</h3>
          </div>
          <button
            onClick={loadBanner}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {bannerLoading ? "Đang tải..." : "Tải"}
          </button>
        </div>

        {banner && (
          <div className="space-y-4">
            <label htmlFor="settings-bannerEnabled" className="flex items-center gap-2 cursor-pointer">
              <input
                id="settings-bannerEnabled"
                type="checkbox"
                checked={banner.is_enabled}
                onChange={(e) => setBanner({ ...banner, is_enabled: e.target.checked })}
                className="rounded border-gray-300 text-[#8D6E53] focus:ring-[#8D6E53]"
              />
              <span className="text-sm font-medium text-gray-700">Hiển thị banner</span>
            </label>
            <textarea
              value={banner.content}
              onChange={(e) => setBanner({ ...banner, content: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent"
              placeholder="Nội dung banner..."
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveBanner}
                disabled={bannerSaving}
                className="px-4 py-2 bg-[#8D6E53] text-white rounded-lg text-sm font-semibold hover:bg-[#7A5F47] transition-colors disabled:opacity-50"
              >
                {bannerSaving ? "Đang lưu..." : "Lưu banner"}
              </button>
              {bannerMsg && (
                <span className={`text-xs font-medium ${bannerMsg.startsWith("Đã") ? "text-green-600" : "text-red-600"}`}>
                  {bannerMsg}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Database Backup */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-gray-900">Sao lưu dữ liệu</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Xuất tất cả dữ liệu từ database thành file SQL để sao lưu.</p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackup}
            disabled={backupLoading}
            className="px-4 py-2 bg-[#8D6E53] text-white rounded-lg text-sm font-semibold hover:bg-[#7A5F47] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            {backupLoading ? "Đang backup..." : "Tạo backup"}
          </button>
          {backupSql && (
            <button
              onClick={downloadBackup}
              className="px-4 py-2 bg-gray-950 text-white rounded-lg text-sm font-semibold hover:bg-black transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tải file SQL
            </button>
          )}
          {backupMsg && (
            <span className={`text-xs font-medium ${backupMsg.startsWith("Đã") ? "text-green-600" : "text-red-600"}`}>
              {backupMsg}
            </span>
          )}
        </div>
      </div>

      {/* Push Notification */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Send className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-gray-900">Gửi thông báo</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="notif_role" className="block text-xs font-semibold text-gray-500 mb-1">Đối tượng</label>
            <select
              id="notif_role"
              value={notifRole}
              onChange={(e) => setNotifRole(e.target.value)}
              className="w-full max-w-xs px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent"
            >
              <option value="STAFF">Nhân viên (Staff)</option>
              <option value="MANAGER">Quản lý (Manager)</option>
              <option value="ADMIN">Admin</option>
              <option value="ALL">Tất cả</option>
            </select>
          </div>
          <div>
            <label htmlFor="notif_title" className="block text-xs font-semibold text-gray-500 mb-1">Tiêu đề</label>
            <input
              id="notif_title"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              className="w-full max-w-md px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent"
              placeholder="Ví dụ: Thông báo lịch nghỉ lễ"
            />
          </div>
          <div>
            <label htmlFor="notif_body" className="block text-xs font-semibold text-gray-500 mb-1">Nội dung</label>
            <textarea
              id="notif_body"
              value={notifBody}
              onChange={(e) => setNotifBody(e.target.value)}
              rows={3}
              className="w-full max-w-md px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent"
              placeholder="Nội dung thông báo..."
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSendNotification}
              disabled={notifSending}
              className="px-4 py-2 bg-[#8D6E53] text-white rounded-lg text-sm font-semibold hover:bg-[#7A5F47] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              {notifSending ? "Đang gửi..." : "Gửi thông báo"}
            </button>
            {notifMsg && (
              <span className={`text-xs font-medium ${notifMsg.startsWith("Đã") ? "text-green-600" : "text-red-600"}`}>
                {notifMsg}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
