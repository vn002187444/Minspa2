'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core';
import React, { type ReactNode } from 'react';

interface DraggableApptCardProps {
  appt: { id: string };
  mode: 'READ_ONLY' | 'STAFF' | 'ADMIN';
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}

export const DraggableApptCard = React.memo(function DraggableApptCard({ appt, mode, className, children, onClick }: DraggableApptCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: appt.id,
    data: { appt }
  });

  if (mode !== 'ADMIN') {
    return (
      <div className={className} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick?.()}>
        {children}
      </div>
    );
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
});

interface DroppableSlotCellProps {
  id: string;
  staffId: string;
  children?: ReactNode;
  className?: string;
}

export const DroppableSlotCell = React.memo(function DroppableSlotCell({ id, staffId, children, className }: DroppableSlotCellProps) {
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
});

interface DroppableStaffCardProps {
  staffId: string;
  children?: ReactNode;
  className?: string;
}

export const DroppableStaffCard = React.memo(function DroppableStaffCard({ staffId, children, className }: DroppableStaffCardProps) {
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
});
