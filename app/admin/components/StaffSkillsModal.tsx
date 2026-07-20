"use client";

import { useState, useEffect, startTransition } from "react";
import { X, Award, Trash2, Plus, Save, FileText } from "lucide-react";
import { toast } from "sonner";
import { getStaffSkills, saveStaffSkill, deleteStaffSkill } from "../actions";
import { createClient } from "@/utils/supabase/client";

interface Skill {
  id: string;
  service_id: string;
  skill_level: number;
  certificate_name?: string;
  certificate_url?: string;
  is_active: boolean;
  services: {
    name: string;
  };
}

interface Props {
  staffId: string;
  staffName: string;
  onClose: () => void;
  onReload: () => void;
}

export default function StaffSkillsModal({ staffId, staffName, onClose, onReload }: Props) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSkill, setEditingSkill] = useState<{
    service_id: string;
    skill_level: number;
    certificate_name: string;
    certificate_url: string;
  } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        startTransition(() => { setLoading(true); });
        // Load staff skills
        const staffSkills = await getStaffSkills(staffId);
        startTransition(() => { setSkills(staffSkills || []); });

        // Load all active services for the selection dropdown
        const { data: servicesData, error: servicesError } = await supabase
          .from("services")
          .select("id, name")
          .eq("is_active", true)
          .order("name");
        
        if (servicesError) throw servicesError;
        startTransition(() => { setServices(servicesData || []); });
      } catch (err: unknown) {
        startTransition(() => { toast.error("Lỗi tải dữ liệu kỹ năng: " + (err instanceof Error ? err.message : "Unknown error")); });
      } finally {
        startTransition(() => { setLoading(false); });
      }
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  const handleSave = async () => {
    if (!editingSkill) return;

    try {
      const existingSkill = skills.find((s) => s.service_id === editingSkill.service_id);
      
      await saveStaffSkill({
        staff_id: staffId,
        service_id: editingSkill.service_id,
        skill_level: editingSkill.skill_level,
        certificate_name: editingSkill.certificate_name,
        certificate_url: editingSkill.certificate_url,
        is_active: true,
      });

      toast.success(existingSkill ? "Đã cập nhật kỹ năng" : "Đã thêm kỹ năng mới");
      setEditingSkill(null);
      setIsAdding(false);
      await onReload();
      setSkills(await getStaffSkills(staffId));
    } catch (err: unknown) {
      toast.error("Lỗi lưu kỹ năng: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleDelete = async (skillId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xoá kỹ năng này?")) return;
    try {
      await deleteStaffSkill(skillId);
      toast.success("Đã xoá kỹ năng");
      await onReload();
      setSkills(await getStaffSkills(staffId));
    } catch (err: unknown) {
      toast.error("Lỗi xoá kỹ năng: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
          <p className="text-sm font-medium text-gray-500">Đang tải dữ liệu kỹ năng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-50 text-pink-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-display">Quản lý Kỹ năng & Chứng chỉ</h3>
              <p className="text-xs text-gray-500 font-medium">Nhân viên: {staffName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Add / Edit Section */}
          {(isAdding || editingSkill) && (
            <div className="mb-8 p-5 bg-pink-50/50 border border-pink-100 rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-pink-900 flex items-center gap-2">
                  {isAdding ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {isAdding ? "Thêm Kỹ năng mới" : "Cập nhật Kỹ năng"}
                </h4>
                <button onClick={() => { setEditingSkill(null); setIsAdding(false); }} className="text-xs text-pink-600 hover:underline cursor-pointer">Huỷ bỏ</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 ml-1">Dịch vụ</label>
                  <select 
                    value={editingSkill?.service_id || ""} 
                    onChange={(e) => setEditingSkill({ ...editingSkill!, service_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Chọn dịch vụ --</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 ml-1">Cấp độ (1-5)</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setEditingSkill({ ...editingSkill!, skill_level: lvl })}
                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          editingSkill?.skill_level === lvl ? "bg-pink-600 text-white shadow-md scale-110" : "bg-white text-gray-400 border border-gray-200 hover:border-pink-300"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Tên chứng chỉ (nếu có)</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={editingSkill?.certificate_name || ""} 
                      onChange={(e) => setEditingSkill({ ...editingSkill!, certificate_name: e.target.value })}
                      placeholder="Ví dụ: Chứng chỉ Nail Art Professional"
                      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">URL chứng chỉ (nếu có)</label>
                  <input 
                    type="text" 
                    value={editingSkill?.certificate_url || ""} 
                    onChange={(e) => setEditingSkill({ ...editingSkill!, certificate_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  />
                </div>
              </div>
              <button 
                onClick={handleSave}
                disabled={!editingSkill?.service_id}
                className="w-full py-2.5 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
              >
                {isAdding ? "Thêm Kỹ năng" : "Lưu Thay đổi"}
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-700">Danh sách kỹ năng hiện có</h4>
              {!isAdding && !editingSkill && (
                <button 
                  onClick={() => {
                    setIsAdding(true);
                    setEditingSkill({ service_id: "", skill_level: 3, certificate_name: "", certificate_url: "" });
                  }}
                  className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Thêm mới
                </button>
              )}
            </div>

            {skills.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">Nhân viên này chưa được gán kỹ năng nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {skills.map((skill) => (
                  <div key={skill.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between group hover:border-pink-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-50 text-gray-600 rounded-lg">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{skill.services?.name || "Dịch vụ không xác định"}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-gray-400 uppercase">Level:</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              skill.skill_level >= 4 ? "bg-emerald-50 text-emerald-600" : 
                              skill.skill_level >= 3 ? "bg-blue-50 text-blue-600" : 
                              "bg-gray-50 text-gray-600"
                            }`}>
                              {skill.skill_level}
                            </span>
                          </div>
                          {skill.certificate_name && (
                            <div className="flex items-center gap-1 text-gray-400">
                              <FileText className="w-3 h-3" />
                              <span className="text-[11px] font-medium truncate max-w-[150px]">{skill.certificate_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingSkill({
                            service_id: skill.service_id,
                            skill_level: skill.skill_level,
                            certificate_name: skill.certificate_name || "",
                            certificate_url: skill.certificate_url || "",
                          });
                          setIsAdding(false);
                        }}
                        className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(skill.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
