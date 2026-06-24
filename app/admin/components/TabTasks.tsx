'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Filter, CheckCircle2, Clock, XCircle, AlertTriangle, ChevronDown, Search, ListTodo, RefreshCw, User, Calendar, Hourglass, AlertCircle } from 'lucide-react'
import LoadingButton from '@/components/LoadingButton'
import { getTasks, createTask, updateTaskStatus, deleteTask, getStaffs, getTaskStats } from '../actions'

export default function TabTasks() {
  const [tasks, setTasks] = useState<any[]>([])
  const [staffs, setStaffs] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)

  const loadTasks = async () => {
    setLoading(true)
    const filters: any = {}
    if (statusFilter !== 'ALL') filters.status = statusFilter
    if (searchTerm.trim()) filters.search = searchTerm.trim()
    if (assigneeFilter) filters.assigneeId = assigneeFilter
    if (typeFilter) filters.taskType = typeFilter
    const [t, st, s] = await Promise.all([
      getTasks(Object.keys(filters).length > 0 ? filters : undefined),
      getStaffs(),
      getTaskStats(),
    ])
    setTasks(t)
    setStaffs(st || [])
    setStats(s)
    setLoading(false)
  }

  useEffect(() => { loadTasks() }, [statusFilter, assigneeFilter, typeFilter])

  const isOverdue = (task: any) => {
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') return false
    if (!task.deadline) return false
    return new Date(task.deadline) < new Date()
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-gray-100 text-gray-500',
    REJECTED: 'bg-red-100 text-red-700',
  }

  const statusIcons: Record<string, any> = {
    PENDING: Clock,
    IN_PROGRESS: RefreshCw,
    COMPLETED: CheckCircle2,
    CANCELLED: XCircle,
    REJECTED: XCircle,
  }

  const priorityColors: Record<string, string> = {
    low: 'text-gray-400',
    medium: 'text-amber-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 font-display flex items-center gap-2">
          <ListTodo className="w-6 h-6 text-pink-500" />
          Quản lý Công việc
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-gray-950 text-white rounded-xl text-sm font-bold hover:bg-black cursor-pointer flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo công việc
        </button>
      </div>

      {/* Stats Cards (4.11) */}
      {stats && (
        <div className="grid grid-cols-5 gap-3">
          <StatBadge label="Tổng" value={stats.total} color="bg-gray-100 text-gray-700" />
          <StatBadge label="Chưa nhận" value={stats.pending} color="bg-amber-100 text-amber-800" />
          <StatBadge label="Đang làm" value={stats.inProgress} color="bg-blue-100 text-blue-800" />
          <StatBadge label="Hoàn thành" value={stats.completed} color="bg-emerald-100 text-emerald-800" />
          <StatBadge label="Trễ hạn" value={stats.overdue} color={stats.overdue > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'} />
        </div>
      )}

      {/* Search + Filters (4.12) */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') loadTasks() }}
              placeholder="Tìm kiếm công việc..."
              className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:border-pink-500 focus:outline-none"
            />
          </div>
          <button
            onClick={loadTasks}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 cursor-pointer"
            title="Tìm"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className={`p-2 rounded-xl cursor-pointer ${showAdvancedFilter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="Bộ lọc nâng cao"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button onClick={loadTasks} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 cursor-pointer" title="Làm mới">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {showAdvancedFilter && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="px-3 py-2 border-2 border-gray-200 rounded-xl text-xs font-semibold focus:border-pink-500 focus:outline-none">
              <option value="">Tất cả NV</option>
              {staffs.filter((s: any) => s.role === 'STAFF' || s.role === 'MANAGER').map((s: any) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border-2 border-gray-200 rounded-xl text-xs font-semibold focus:border-pink-500 focus:outline-none">
              <option value="">Tất cả loại</option>
              <option value="daily">Hàng ngày</option>
              <option value="one_time">Một lần</option>
            </select>
          </div>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2">
        {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'ALL' ? 'Tất cả' : s === 'PENDING' ? 'Chưa nhận' : s === 'IN_PROGRESS' ? 'Đang làm' : 'Hoàn thành'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Không tìm thấy công việc nào</p>
          <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo công việc mới</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const StatusIcon = statusIcons[task.status] || Clock
            const overdue = isOverdue(task)
            return (
              <div key={task.id} className={`bg-white p-5 rounded-2xl border shadow-sm space-y-3 hover:shadow-md transition-shadow ${
                overdue ? 'border-red-200 bg-red-50/20' : 'border-gray-100'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[task.status] || 'bg-gray-100 text-gray-600'}`}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {task.status === 'PENDING' ? 'Chưa nhận' : task.status === 'IN_PROGRESS' ? 'Đang làm' : task.status === 'COMPLETED' ? 'Hoàn thành' : task.status === 'REJECTED' ? 'Từ chối' : 'Đã hủy'}
                      </span>
                      {overdue && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                          <AlertCircle className="w-3 h-3 inline mr-1" />Trễ hạn
                        </span>
                      )}
                      <span className={`text-[10px] font-bold ${priorityColors[task.priority] || 'text-gray-400'}`}>
                        {task.priority === 'urgent' ? '🔴 Khẩn cấp' : task.priority === 'high' ? '🟠 Cao' : task.priority === 'medium' ? '🟡 Trung bình' : '🟢 Thấp'}
                      </span>
                      {task.task_type === 'daily' && (
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Hàng ngày</span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {task.status === 'PENDING' && (
                      <button
                        onClick={async () => {
                          const res = await deleteTask(task.id)
                          if (res.success) { toast.success('Đã xóa công việc'); loadTasks() }
                          else toast.error(res.error || 'Lỗi xóa')
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 cursor-pointer"
                        title="Xóa"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 border-t border-gray-50 pt-3">
                  {task.assignee && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {task.assignee.full_name}
                    </span>
                  )}
                  {task.assignee_type === 'all' && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <User className="w-3 h-3" />
                      Toàn bộ NV
                    </span>
                  )}
                  {task.creator && (
                    <span className="text-gray-400">Tạo bởi: {task.creator.full_name}</span>
                  )}
                  {task.deadline && (
                    <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-bold' : ''}`}>
                      <Calendar className="w-3 h-3" />
                      Hạn: {new Date(task.deadline).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                  <span className="text-gray-400">
                    {new Date(task.created_at).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateTaskModal
          staffs={staffs}
          onClose={() => setShowCreateModal(false)}
          onSaved={() => { setShowCreateModal(false); loadTasks() }}
        />
      )}
    </div>
  )
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`p-3 rounded-xl text-center ${color}`}>
      <div className="text-lg font-extrabold">{value}</div>
      <div className="text-[10px] font-bold uppercase opacity-75">{label}</div>
    </div>
  )
}

interface CreateTaskModalStaff {
  id: string;
  role: string;
  full_name: string;
}

interface CreateTaskModalProps {
  staffs: CreateTaskModalStaff[];
  onClose: () => void;
  onSaved: () => void;
}

function CreateTaskModal({ staffs, onClose, onSaved }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [taskType, setTaskType] = useState<'daily' | 'one_time'>('one_time')
  const [assigneeType, setAssigneeType] = useState<'specific' | 'all'>('specific')
  const [assigneeId, setAssigneeId] = useState('')
  const [deadline, setDeadline] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [priority, setPriority] = useState('medium')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast.error('Vui lòng nhập tiêu đề công việc'); return }
    if (assigneeType === 'specific' && !assigneeId) { toast.error('Vui lòng chọn nhân viên'); return }

    setSaving(true)
    try {
      const res = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        taskType,
        assigneeId: assigneeType === 'specific' ? assigneeId : null,
        assigneeType,
        deadline: deadline || undefined,
        timeSlot: timeSlot || undefined,
        priority,
      })
      if (res.success) {
        toast.success('Đã tạo công việc thành công!')
        onSaved()
      } else {
        toast.error(res.error || 'Lỗi khi tạo công việc')
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi không xác định')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-150 p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-pink-500" />
            Tạo công việc mới
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="task-title" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Tiêu đề *</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Vệ sinh khu vực làm việc"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:border-pink-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="task-description" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Mô tả</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chi tiết công việc..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:border-pink-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" id="task-type-label">Loại công việc</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTaskType('one_time')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                    taskType === 'one_time' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  Một lần
                </button>
                <button
                  type="button"
                  onClick={() => setTaskType('daily')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                    taskType === 'daily' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  Hàng ngày
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="task-priority" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Mức ưu tiên</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:border-pink-500 focus:outline-none"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block" id="task-assignee-label">Giao cho</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setAssigneeType('specific')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                  assigneeType === 'specific' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-600'
                }`}
              >
                Chỉ định
              </button>
              <button
                type="button"
                onClick={() => { setAssigneeType('all'); setAssigneeId('') }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                  assigneeType === 'all' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-600'
                }`}
              >
                Toàn bộ NV
              </button>
            </div>
            {assigneeType === 'specific' && (
              <select
                id="task-assigneeId"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:border-pink-500 focus:outline-none"
              >
                <option value="">Chọn nhân viên...</option>
                {staffs.filter((s: any) => s.role === 'STAFF' || s.role === 'MANAGER').map((s: any) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-deadline" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Hạn hoàn thành</label>
              <input
                id="task-deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:border-pink-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="task-timeSlot" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Khung giờ</label>
              <input
                id="task-timeSlot"
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="VD: 08:00-09:00"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700 cursor-pointer">
              Hủy
            </button>
            <LoadingButton
              type="submit"
              isLoading={saving}
              loadingText="Đang tạo..."
              className="flex-1 py-3 bg-gray-950 hover:bg-black rounded-xl text-sm font-bold text-white cursor-pointer"
            >
              Tạo công việc
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  )
}
