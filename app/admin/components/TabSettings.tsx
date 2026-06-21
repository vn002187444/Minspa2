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
} from "lucide-react";
import {
  getSystemHealth,
  triggerCronJob,
  createManualNotification,
  getCronJobStatuses,
  getBannerSettings,
  saveBannerSettings,
} from "../actions";

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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
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
