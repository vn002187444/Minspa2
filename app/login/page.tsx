"use client"
import { useEffect, useState, startTransition } from 'react';
import Link from 'next/link';
import { Sparkles, User, Lock, AlertCircle, ArrowRight, LogIn, ArrowLeft } from 'lucide-react';
import { loginUser } from './actions';

export default function LoginPage() {
  const [authError, setAuthError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('auth_err') === '1') {
        startTransition(() => {
          setAuthError(true);
        });
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    try {
      const data = await loginUser(null, formData);
      if (data && !data.success) {
        setErrorMsg(data.message || 'Sai tên đăng nhập hoặc mật khẩu.');
      }
    } catch (err: any) {
      console.error('Login error caught:', err);
      setErrorMsg(
        err?.message || 'Không thể kết nối đến máy chủ. Vui lòng mở trang web trong tab mới (Open in new tab) hoặc sử dụng các tài khoản khẩn cấp dưới đây.'
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-pink-100/50 to-transparent -z-10" />
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-pink-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-1/3 -right-20 w-72 h-72 bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8">
          <div className="mb-6 flex justify-start">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> ← Quay lại trang chủ
            </Link>
          </div>
          <div className="w-20 h-20 bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative overflow-hidden shadow-lg shadow-gray-200/50">
            <span className="font-display font-bold text-4xl text-white z-10">M</span>
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/80 to-transparent mix-blend-overlay"></div>
          </div>
          
          <h2 className="text-2xl font-display font-bold text-center text-gray-900 mb-2">
            Đăng nhập hệ thống
          </h2>
          <p className="text-center text-gray-500 mb-6 text-sm">
            Min Nail & Hair Management
          </p>

          <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs border border-emerald-100 flex flex-col gap-2 relative group animate-in fade-in duration-200">
            <p className="font-semibold flex items-center gap-1"><Sparkles className="w-3" /> Tài khoản thử nghiệm nhanh (Quick Credentials):</p>
            <p>• Admin: <span className="font-mono bg-emerald-100 px-1 py-0.5 rounded font-bold">admin</span> / mật khẩu: <span className="font-mono bg-emerald-100 px-1 py-0.5 rounded font-bold">Admin</span> hoặc <span className="font-mono bg-emerald-100 px-1 py-0.5 rounded font-bold">admin</span></p>
            <p>• Staff: <span className="font-mono bg-emerald-100 px-1 py-0.5 rounded font-bold">staff1</span> / mật khẩu: <span className="font-mono bg-emerald-100 px-1 py-0.5 rounded font-bold">Staff@1</span> hoặc <span className="font-mono bg-emerald-100 px-1 py-0.5 rounded font-bold">staff1</span></p>
            <p className="mt-1 text-[10px] text-emerald-700/85 italic border-t border-emerald-200/50 pt-1.5">• Mẹo: Nếu trình duyệt của bạn chặn cookie bên thứ ba (Third-party Cookies) trong khung preview này, hãy nhấn nút <span className="font-semibold">Mở trong tab mới (Open in new tab)</span> ở góc trên bên phải màn hình để đăng nhập trơn tru nhất!</p>
            <button 
               type="button"
               onClick={() => {
                  const u = document.querySelector('input[name="username"]') as HTMLInputElement;
                  const p = document.querySelector('input[name="password"]') as HTMLInputElement;
                  if(u && p) { u.value='admin'; p.value='admin'; }
               }} 
               className="absolute top-4 right-4 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-xs flex items-center gap-1 shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 min-h-[44px]">
               <LogIn className="w-3" /> Auto-Fill
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-start gap-3 text-sm border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          {authError && (
            <div className="mb-6 p-4 bg-amber-50 text-amber-900 rounded-2xl flex items-start gap-3 text-xs border border-amber-200 font-medium animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1 col-span-2">Phát hiện chặn Cookie bên thứ ba</p>
                <p>Hệ thống vừa từ chối truy cập vì không tìm thấy cookie phiên. Điều này thường do trình duyệt của bạn đang chặn Cookie bên thứ ba (Third-party Cookies) trong khung iframe preview.</p>
                <p className="mt-1.5 font-bold text-amber-950">Giải pháp khắc phục cực kỳ đơn giản:</p>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-amber-800">
                  <li>Hãy nhấn nút <span className="font-extrabold text-pink-700">Mở trong tab mới (Open in new tab)</span> ở góc trên cùng bên phải màn hình để chạy hệ thống ở cửa sổ chính thức, tránh bị trình duyệt cản trở cookie!</li>
                  <li>Nếu mở trên tab mới rồi vẫn lỗi, vui lòng thử dùng tài khoản thử nghiệm nhanh bên dưới.</li>
                </ul>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login_username" className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                Tài khoản
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="login_username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1 pr-1">
                <label htmlFor="login_password" className="block text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>
                <button type="button" className="text-xs font-semibold text-pink-600 hover:text-pink-700 transition-colors">
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="login_password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gray-900 hover:bg-black text-white font-medium py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20"
              >
                {isPending ? (
                  <span className="animate-pulse">Đang đăng nhập...</span>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
