'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core';

export function DraggableApptCard({ appt, mode, className, children, onClick }: any) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: appt.id,
    data: { appt }
  });

  if (mode !== 'ADMIN') {
    return <div className={className} onClick={onClick}>{children}</div>;
  }

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isDragging ? 'opacity-50' : ''}`}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
       {children}
    </div>
  );
}

export function DroppableSlotCell({ id, staffId, children, className }: any) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { staffId }
  });

  return (
    <td
      ref={setNodeRef}
      className={className + (isOver ? ' bg-amber-50 ring-2 ring-dashed ring-amber-500 rounded-xl z-20 shadow-inner' : '')}
    >
      {children}
    </td>
  );
}

export function DroppableStaffCard({ staffId, children, className }: any) {
  const { isOver, setNodeRef } = useDroppable({
    id: `staff-${staffId}`,
    data: { staffId }
  });

  return (
    <div
      ref={setNodeRef}
      className={className + (isOver ? ' border-amber-500 bg-amber-50/50 ring-2 ring-amber-500 ring-opacity-50' : ' border-[#EADDCD]')}
    >
      {children}
    </div>
  );
}
