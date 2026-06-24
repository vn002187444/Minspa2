'use client';

import { useState, useEffect } from "react";
import { RefreshCw, Search, Package } from "lucide-react";
import { format } from "date-fns";
import { getCustomerByPhone, sellPackageToCustomer, getCustomerPackageProgress } from "../actions";

export default function TabSellAndProgress({ packages, onReload }: { packages: any[]; onReload: () => void }) {
  const [subTab, setSubTab] = useState<"SEARCH" | "SELL">("SEARCH");
  
  // Search states
  const [searchPhone, setSearchPhone] = useState("");
  const [findingProgress, setFindingProgress] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState("");

  // Sell states
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sellMessage, setSellMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto-search customer info in the Sell view
  useEffect(() => {
    const cleanedPhone = phone.trim().replace(/\s+/g, "");
    if (cleanedPhone.length >= 9) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const cust = await getCustomerByPhone(cleanedPhone);
          if (cust) {
            setCustomerName(cust.full_name);
            setFoundCustomer(cust);
            setIsNewCustomer(false);
          } else {
            setCustomerName("");
            setFoundCustomer(null);
            setIsNewCustomer(true);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setFoundCustomer(null);
      setIsNewCustomer(false);
      setIsSearching(false);
    }
  }, [phone]);

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellMessage(null);

    const cleanedPhone = phone.trim().replace(/\s+/g, "");
    if (!cleanedPhone || !customerName || !selectedPackageId) {
      setSellMessage({ type: "error", text: "Vui lòng nhập đầy đủ Số điện thoại, Tên khách hàng và chọn Gói liệu trình!" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await sellPackageToCustomer(cleanedPhone, customerName, selectedPackageId);
      if (res.success) {
        setSellMessage({ type: "success", text: res.message || "Bán và kích hoạt gói thành công!" });
        setPhone("");
        setCustomerName("");
        setSelectedPackageId("");
        setFoundCustomer(null);
        setIsNewCustomer(false);
        onReload();
      } else {
        setSellMessage({ type: "error", text: res.error || "Có lỗi xảy ra" });
      }
    } catch (err: any) {
      setSellMessage({ type: "error", text: "Lỗi kết nối máy chủ: " + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProgressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setSearchResult(null);
    
    const cleanedPhone = searchPhone.trim().replace(/\s+/g, "");
    if (!cleanedPhone) {
      setSearchError("Vui lòng nhập số điện thoại");
      return;
    }

    setFindingProgress(true);
    try {
      const res = await getCustomerPackageProgress(cleanedPhone);
      if (res.success) {
        setSearchResult(res);
      } else {
        setSearchError(res.error || "Không tìm thấy dữ liệu.");
      }
    } catch (err: any) {
      setSearchError("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      setFindingProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Select Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-display">
            Gói Liệu Trình Khách Hàng
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Mua gói ưu đãi mới hoặc tra cứu và theo dõi số buổi liệu trình còn lại của khách hàng.
          </p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/50 w-full sm:w-auto">
          <button
            onClick={() => setSubTab("SEARCH")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "SEARCH" ? "bg-[#8D6E53] text-white shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Tra Cứu Tiến Độ
          </button>
          <button
            onClick={() => setSubTab("SELL")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "SELL" ? "bg-[#8D6E53] text-white shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Đăng Ký Bán Gói
          </button>
        </div>
      </div>

      {subTab === "SEARCH" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-200">
          {/* Query Box */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 font-sans text-xs">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 font-display">Nhập số điện thoại cần tra cứu</h3>
            <form onSubmit={handleProgressSearch} className="space-y-4">
              <div>
                <input
                  type="tel"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="VD: 0912345678"
                  className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#8D6E53] outline-none transition-all placeholder:text-gray-400 font-bold text-base bg-gray-50/50 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={findingProgress}
                className="w-full bg-gray-900 text-white hover:bg-black font-semibold p-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-xs uppercase"
              >
                {findingProgress ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Tra cứu tiến trình
              </button>
            </form>
            {searchError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs font-bold">
                {searchError}
              </div>
            )}
          </div>

          {/* Results Box */}
          <div className="lg:col-span-2 space-y-4">
            {searchResult ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Customer header */}
                <div className="bg-[#FAF5F0] p-6 rounded-3xl border border-[#F0E6DD] shadow-xs">
                  <p className="text-[10px] text-[#A68F7B] font-bold uppercase tracking-wider">Thông tin khách hàng</p>
                  <h3 className="text-lg font-black text-stone-900 mt-1">{searchResult.customer.full_name}</h3>
                  <p className="text-xs text-stone-500 font-mono font-bold mt-0.5">{searchResult.customer.phone}</p>
                </div>

                {/* Packages list */}
                {searchResult.packages.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm text-gray-400 text-xs italic">
                    Khách hàng này chưa từng đăng ký gói liệu trình nào.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {searchResult.packages.map((cp: any) => (
                      <div key={cp.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 font-sans text-xs">
                        <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                          <div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                              cp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                            }`}>
                              {cp.status === 'ACTIVE' ? 'ĐANG KÍCH HOẠT' : 'ĐÃ DÙNG HẾT'}
                            </span>
                            <h4 className="text-[15px] font-extrabold text-stone-900 mt-1.5 font-display">{cp.treatment_packages?.name}</h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">Ngày mua: {format(new Date(cp.purchased_at), 'dd/MM/yyyy HH:mm')}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Số buổi còn lại</p>
                            <p className="text-xl font-black text-[#8D6E53] font-mono mt-0.5">
                              {cp.remaining_sessions} <span className="text-xs font-normal text-gray-400 font-sans">/ {cp.total_sessions} buổi</span>
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-[#8D6E53] h-full rounded-full transition-all duration-500" 
                              style={{ width: `${(cp.remaining_sessions / cp.total_sessions) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Session log detail */}
                        <div className="pt-2">
                          <h5 className="text-[11px] font-black text-[#8D6E53] uppercase tracking-wider mb-2">Nhật ký sử dụng ({cp.logs.length})</h5>
                          {cp.logs.length === 0 ? (
                            <p className="text-stone-400 text-[10.5px] italic">Chưa phát sinh lượt khấu trừ nào.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {cp.logs.map((log: any) => (
                                <div key={log.id} className="bg-stone-50 p-2.5 rounded-xl border border-stone-100/50 text-[11px] flex justify-between items-center text-stone-650">
                                  <div>
                                    <p className="font-bold">{log.notes || 'Khấu trừ 1 buổi'}</p>
                                    <p className="text-[9.5px] text-gray-400 mt-0.5">
                                      Thực hiện bởi: {log.appointments?.users?.full_name || 'Hệ thống'}
                                    </p>
                                  </div>
                                  <span className="text-[10px] font-mono text-gray-400">
                                    {format(new Date(log.used_at), 'dd/MM/yyyy HH:mm')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm text-gray-400 text-xs italic">
                Nhập số điện thoại khách hàng ở ô bên trái để tra cứu tiến độ dùng liệu trình.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm max-w-xl mx-auto space-y-6 animate-in fade-in duration-200 text-xs font-sans">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-stone-900 font-display flex items-center gap-2">
              <Package className="w-5 h-5 text-[#8D6E53]" />
              Bán Gói Liệu Trình Mới
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Kích hoạt buổi combo liệu trình cho số điện thoại khách hàng</p>
          </div>

          <form onSubmit={handleSell} className="space-y-5">
            {sellMessage && (
              <div
                className={`p-4 rounded-xl text-xs font-bold leading-relaxed border ${
                  sellMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-rose-50 text-rose-700 border-rose-100"
                }`}
              >
                {sellMessage.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="sell-phone" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Số điện thoại khách hàng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="sell-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    required
                    className="w-full p-3.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8D6E53] outline-none transition-all placeholder:text-gray-400 font-semibold text-sm"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="animate-spin w-4 h-4 border-2 border-[#8D6E53]/20 border-t-[#8D6E53] rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {(phone.trim().length >= 9) && (
                <div className="animate-in fade-in duration-200 space-y-4">
                  <div>
                    <label htmlFor="sell-customerName" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Họ và tên khách hàng <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="sell-customerName"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nhập họ tên khách hàng"
                      required
                      disabled={foundCustomer !== null}
                      className={`w-full p-3.5 border rounded-xl outline-none transition-all font-semibold ${
                        foundCustomer
                          ? "bg-emerald-50 border-emerald-100 text-emerald-950 cursor-not-allowed text-sm"
                          : "bg-white border-gray-200 focus:ring-2 focus:ring-[#8D6E53] text-sm"
                      }`}
                    />
                  </div>

                  <div>
                    <label htmlFor="sell-package" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Chọn Gói Liệu Trình <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="sell-package"
                      value={selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      required
                      className="w-full p-3.5 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-[#8D6E53] outline-none transition-all font-semibold text-sm cursor-pointer"
                    >
                      <option value="">-- Chọn gói mong muốn --</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.total_sessions} buổi - {pkg.price?.toLocaleString('vi')} đ)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#8D6E53] hover:bg-[#6b513b] text-white font-bold p-3.5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow text-xs active:scale-95 disabled:opacity-50 uppercase tracking-wider mt-2"
                  >
                    {submitting ? "Đang xử lý kích hoạt..." : "Kích hoạt và Bán gói ngay"}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
