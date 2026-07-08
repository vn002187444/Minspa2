'use client'
import { useState, useEffect, startTransition } from 'react';
import { toast } from 'sonner';

export default function StaffTasksTab() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const loadTasks = async () => {
    setLoading(true)
    const { getTasksForStaff } = await import('@/app/admin/actions')
    const t = await getTasksForStaff()
    setTasks(t)
    setLoading(false)
  }

  useEffect(() => { startTransition(() => { loadTasks() }) }, [])

  const handleStatusUpdate = async (taskId: string, status: string) => {
    const { updateTaskStatus } = await import('@/app/admin/actions')
    const res = await updateTaskStatus(taskId, status)
    if (res.success) {
      toast.success(status === 'COMPLETED' ? '✅ Đã hoàn thành công việc!' : status === 'IN_PROGRESS' ? '⏳ Đang thực hiện...' : status === 'REJECTED' ? '❌ Đã từ chối' : '⏸ Đã tạm dừng')
      loadTasks()
    } else {
      toast.error(res.error || 'Lỗi')
    }
  }

  const filteredTasks = statusFilter === 'ALL' ? tasks : tasks.filter(t => t.status === statusFilter)

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-gray-100 text-gray-500',
    REJECTED: 'bg-red-100 text-red-700',
  }

  const priorityColors: Record<string, string> = {
    low: 'text-gray-400', medium: 'text-amber-500', high: 'text-orange-500', urgent: 'text-red-500',
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[44px] ${
              statusFilter === s ? 'bg-pink-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'ALL' ? 'Tất cả' : s === 'PENDING' ? 'Chờ xử lý' : s === 'IN_PROGRESS' ? 'Đang làm' : s === 'COMPLETED' ? 'Hoàn thành' : 'Từ chối'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-2xl" />)}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-xs font-medium italic">Không có công việc nào.</div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{task.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{task.description || 'Không có mô tả'}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[task.status] || 'bg-gray-100 text-gray-600'}`}>{task.status}</span>
                  <span className={`text-[10px] font-bold ${priorityColors[task.priority] || 'text-gray-400'}`}>#{task.priority}</span>
                </div>
              </div>

              {task.status !== 'COMPLETED' && task.status !== 'REJECTED' && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  {task.status === 'PENDING' && (
                    <button onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')} className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px]">
                      ⏳ Nhận làm
                    </button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <>
                      <button onClick={() => handleStatusUpdate(task.id, 'COMPLETED')} className="flex-[2] py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px]">
                        ✅ Hoàn thành
                      </button>
                      <button onClick={() => handleStatusUpdate(task.id, 'REJECTED')} className="flex-1 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px]">
                        ❌ Từ chối
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
