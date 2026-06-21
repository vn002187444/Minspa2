export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';
export type AppointmentStatus = 'PENDING_RANDOM' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';
export type RecipientType = 'user' | 'customer';
export type PackageStatus = 'ACTIVE' | 'EXHAUSTED';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  full_name: string;
  cccd?: string;
  is_active: boolean;
  notification_token?: any;
  created_at: string;
}

export interface Appointment {
  id: string;
  customer_id: string;
  staff_id?: string;
  start_time: string;
  end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  status: AppointmentStatus;
  total_price: number;
  discount: number;
  tip?: number;
  staff_commission?: number;
  package_id?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  notification_token?: any;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  commission: number;
  description?: string;
  is_active: boolean;
}

export interface Notification {
  id: string;
  recipient_id: string;
  recipient_type: RecipientType;
  title: string;
  content: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
}

export interface TreatmentPackage {
  id: string;
  name: string;
  price: number;
  buy_count: number;
  free_count: number;
  total_sessions: number;
  services: string[];
  is_active: boolean;
  commission?: number;
}

export interface CustomerPackage {
  id: string;
  customer_id: string;
  package_id: string;
  total_sessions: number;
  remaining_sessions: number;
  status: PackageStatus;
  purchased_at: string;
  expires_at: string;
  sold_by_staff_id?: string;
  commission_amount?: number;
  created_at: string;
  treatment_packages?: {
    id: string;
    name: string;
    service_id: string;
    services?: {
      name: string;
      price: number;
    };
  };
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface BlogView {
  id: string;
  post_id: string;
  viewed_at: string;
  ip_hash?: string;
  user_agent?: string;
}

export interface BlogStat {
  id: string;
  post_id: string;
  date: string;
  views: number;
}

export interface SeoSettings {
  id: number;
  page_title: string;
  meta_description: string;
  meta_keywords: string;
  og_image_url?: string;
  online_discount_enabled: boolean;
  online_discount_percent: number;
  default_commission_percent: number;
  hotline: string;
}

export interface BannerSettings {
  id: number;
  is_enabled: boolean;
  content: string;
}

export interface BankSettings {
  id: number;
  bank_name: string;
  account_number: string;
  account_name: string;
}
