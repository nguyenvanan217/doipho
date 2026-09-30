import React, { useState, useEffect } from 'react';
import { Plus, Search, GripVertical, Trash2, X, AlertCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  useDroppable,
  useDraggable
} from '@dnd-kit/core';
import { getUsers, getClasses, getSubjects, getAssignments, saveAssignments } from '../lib/db';

// --- Sub components for Drag and Drop ---

function DroppableColumn({ id, title, children }: { id: string | number, title: string, children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col bg-gray-50 dark:bg-zinc-800/40 rounded-xl p-4 min-w-[300px] border-2 transition-colors ${
        isOver ? 'border-black dark:border-white border-dashed' : 'border-gray-200 dark:border-zinc-700'
      }`}
    >
      <h3 className="font-bold text-black dark:text-white mb-4 flex items-center justify-between">
        {title}
        <span className="text-xs font-normal px-2 py-1 bg-gray-200 dark:bg-zinc-700 rounded-full">
          {React.Children.count(children)} lớp
        </span>
      </h3>
      <div className="flex-1 space-y-3 overflow-y-auto min-h-[150px]">
        {children}
        {React.Children.count(children) === 0 && (
          <div className="h-full flex items-center justify-center text-sm text-gray-400 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg py-8">
            Kéo thả vào đây
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ assignment, classNameStr, subjectNameStr, onRemove, onEdit }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: assignment.id.toString(),
    data: assignment
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-all ${
        isDragging ? 'opacity-50 z-50 ring-2 ring-black dark:ring-white' : ''
      }`}
    >
      <div className="flex items-start">
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-black dark:hover:text-white mr-2 mt-1 touch-none">
          <GripVertical size={16} />
        </div>
        <div className="flex-1">
          <div className="font-bold text-black dark:text-white text-sm">{classNameStr}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-1">{subjectNameStr}</div>
          <div className="flex gap-1 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
              {assignment.dayOfWeek || 'Thứ ?'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-medium">
              {assignment.period || 'Tiết ?'}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(assignment)}
            className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded cursor-pointer"
            title="Sửa thời gian"
          >
            <Edit size={14} />
          </button>
          <button 
            onClick={() => onRemove(assignment.id)}
            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded cursor-pointer"
            title="Xóa phân công"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeachingAssignments() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<any>(null);
  const [editId, setEditId] = useState<number | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    teacherId: 0,
    classId: 0,
    subjectId: 0,
    dayOfWeek: 'Thứ 2',
    period: 'Tiết 1'
  });

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor);
  const activeSensors = useSensors(pointerSensor, keyboardSensor);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const users = getUsers();
    setTeachers(users.filter((u: any) => u.role === 'Teacher' || u.role === 'Admin'));
    setClasses(getClasses());
    setSubjects(getSubjects());
    setAssignments(getAssignments());
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveDragItem(active.data.current);
  };

  const handleDragEnd = (event: any) => {
    setActiveDragItem(null);
    const { active, over } = event;
    
    if (!over) return;

    const draggedAssignmentId = Number(active.id);
    const targetTeacherId = Number(over.id);

    // Update assignment teacher
    const updated = assignments.map(a => {
      if (a.id === draggedAssignmentId) {
        return { ...a, teacherId: targetTeacherId };
      }
      return a;
    });

    setAssignments(updated);
    saveAssignments(updated);
    toast.success('Đã cập nhật phân công giảng dạy');
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacherId || !formData.classId || !formData.subjectId) {
      toast.error('Vui lòng chọn đầy đủ thông tin');
      return;
    }

    // Check duplicate class, subject, and time
    const isDuplicate = assignments.some(
      a => a.id !== editId &&
           Number(a.classId) === Number(formData.classId) && 
           Number(a.subjectId) === Number(formData.subjectId) &&
           a.dayOfWeek === formData.dayOfWeek &&
           a.period === formData.period
    );

    if (isDuplicate) {
      toast.error('Lớp này đã được phân công môn này vào cùng thời gian!');
      return;
    }

    if (editId) {
      const updated = assignments.map(a => 
        a.id === editId ? { ...formData, id: editId } : a
      );
      setAssignments(updated);
      saveAssignments(updated);
      toast.success('Cập nhật phân công thành công!');
    } else {
      const newId = assignments.length > 0 ? Math.max(...assignments.map((a: any) => a.id)) + 1 : 1;
      const newAssignment = {
        id: newId,
        ...formData
      };

      const updated = [...assignments, newAssignment];
      setAssignments(updated);
      saveAssignments(updated);
      toast.success('Phân công thành công');
    }
    
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleEdit = (assignment: any) => {
    setFormData({
      teacherId: assignment.teacherId,
      classId: assignment.classId,
      subjectId: assignment.subjectId,
      dayOfWeek: assignment.dayOfWeek || 'Thứ 2',
      period: assignment.period || 'Tiết 1'
    });
    setEditId(assignment.id);
    setIsModalOpen(true);
  };

  const handleRemoveAssignment = (id: number) => {
    if (window.confirm('Hủy phân công này?')) {
      const updated = assignments.filter(a => a.id !== id);
      setAssignments(updated);
      saveAssignments(updated);
      toast.success('Đã hủy phân công');
    }
  };

  const getClassName = (id: number) => classes.find(c => Number(c.id) === Number(id))?.name || 'Lớp không rõ';
  const getSubjectName = (id: number) => subjects.find(s => Number(s.id) === Number(id))?.name || 'Môn không rõ';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 h-[calc(100vh-64px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
            Phân công giảng dạy theo tuần
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-black text-white dark:bg-white dark:text-black">Kéo thả</span>
          </h1>
          <p className="text-sm text-black dark:text-white mt-1">Kéo thả các lớp học giữa các cột để phân công giáo viên.</p>
        </div>
        <button 
          onClick={() => {
            setEditId(null);
            setFormData({ teacherId: teachers[0]?.id || 0, classId: 0, subjectId: 0, dayOfWeek: 'Thứ 2', period: 'Tiết 1' });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} className="mr-2" />
          Phân công mới
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext 
          sensors={activeSensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full items-stretch">
            {teachers.map(teacher => {
              const teacherAssignments = assignments.filter(a => Number(a.teacherId) === Number(teacher.id));
              return (
                <DroppableColumn key={teacher.id} id={teacher.id} title={teacher.fullName}>
                  {teacherAssignments.map(assignment => (
                    <DraggableCard 
                      key={assignment.id} 
                      assignment={assignment}
                      classNameStr={getClassName(assignment.classId)}
                      subjectNameStr={getSubjectName(assignment.subjectId)}
                      onRemove={handleRemoveAssignment}
                      onEdit={handleEdit}
                    />
                  ))}
                </DroppableColumn>
              );
            })}
            {teachers.length === 0 && (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p>Chưa có giáo viên nào trong hệ thống.</p>
              </div>
            )}
          </div>

          <DragOverlay>
            {activeDragItem ? (
              <div className="bg-white dark:bg-zinc-800 border border-black dark:border-white rounded-lg p-3 shadow-2xl opacity-90 rotate-3 scale-105">
                <div className="font-bold text-black dark:text-white text-sm">{getClassName(activeDragItem.classId)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getSubjectName(activeDragItem.subjectId)}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md relative z-10 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-black dark:border-white">
              <h3 className="text-lg font-bold text-black dark:text-white">
                {editId ? 'Sửa phân công' : 'Phân công giáo viên'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-black dark:text-white hover:opacity-70 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddAssignment} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-black dark:text-white">Giáo viên</label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({...formData, teacherId: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                >
                  <option value={0} disabled>-- Chọn giáo viên --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-black dark:text-white">Lớp học</label>
                <select
                  required
                  value={formData.classId}
                  onChange={(e) => setFormData({...formData, classId: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                >
                  <option value={0} disabled>-- Chọn lớp học --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-black dark:text-white">Môn học</label>
                <select
                  required
                  value={formData.subjectId}
                  onChange={(e) => setFormData({...formData, subjectId: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                >
                  <option value={0} disabled>-- Chọn môn học --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-black dark:text-white">Thứ</label>
                  <select
                    required
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                  >
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-black dark:text-white">Tiết</label>
                  <input
                    type="text"
                    required
                    value={formData.period}
                    onChange={(e) => setFormData({...formData, period: e.target.value})}
                    placeholder="VD: Tiết 1 - 2"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditId(null); }}
                  className="px-4 py-2 border border-black dark:border-white text-black dark:text-white rounded-md text-sm font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  {editId ? 'Lưu thay đổi' : 'Phân công'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
