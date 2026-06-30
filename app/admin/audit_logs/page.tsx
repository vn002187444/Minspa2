import { getAuditLogs } from "./audit-logs/actions";
import Link from "next/link";
import { ArrowLeft, Clock, ShieldAlert, FileEdit, UserCircle, Settings2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const logs = await getAuditLogs();

  const getIcon = (action: string) => {
    if (action.includes('SERVICE')) return <Settings2 className="w-4 h-4 text-pink-500" />;
    if (action.includes('STAFF') || action.includes('PASSWORD')) return <UserCircle className="w-4 h-4 text-blue-500" />;
    if (action.includes('STATUS')) return <FileEdit className="w-4 h-4 text-emerald-500" />;
    return <ShieldAlert className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 bg-white text-gray-600 hover:text-gray-900 rounded-xl shadow-sm hover:shadow transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">Nhật ký hoạt động</h1>
            <p className="text-sm text-gray-500">Giám sát hệ thống và phân quyền</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Chưa có nhật ký hoạt động nào.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {logs.map((log: any, idx: number) => (
                <div key={idx} className="p-4 sm:p-6 flex gap-4 hover:bg-gray-50 transition-colors">
                  <div className="mt-1 bg-white p-2 border border-gray-100 shadow-sm rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                    {getIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm mb-1">{log.details}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 font-medium">
                      <span className="bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider">{log.action}</span>
                      <span className="flex items-center gap-1">
                        <UserCircle className="w-3.5 h-3.5" />
                        {log.user_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {log.date_formatted}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
