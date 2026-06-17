export interface TimeLock {
  id: string;
  staff_id: string;
  appointment_id: string;
  lock_date: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface SlotAvailability {
  time: string;
  status: 'past' | 'no_staff_present' | 'fully_booked' | 'some_available' | 'all_available';
  availableStaff: number;
  totalStaff: number;
  availableStaffNames: string[];
  isRecommended: boolean;
}

export interface ServiceOption {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
  description?: string;
  commission: number;
}

export interface CustomerHistory {
  id: string;
  full_name: string;
  phone: string;
  appointments: any[];
  activePackages: any[];
}
