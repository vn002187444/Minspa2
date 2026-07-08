'use server'

import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/utils/auth";
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditAction } from "@/utils/audit";
import { hashPassword, verifyPassword } from "@/lib/password";
import { stripHtml } from "@/lib/sanitize";
import { normalizeNFC } from "@/lib/utils";
import { cachedFetch } from '@/lib/cache';
import { getBaseUrl } from '@/lib/env';

export {
  createClient, getSession, format, subDays, eachDayOfInterval, startOfMonth, endOfMonth,
  revalidatePath, redirect, logAuditAction, hashPassword, verifyPassword,
  stripHtml, normalizeNFC, cachedFetch, getBaseUrl,
};

export async function checkAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
}

export async function checkAdminOrManager() {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
}

export interface StaffInput {
  username?: string;
  password?: string;
  fullName?: string;
  full_name?: string;
  role?: string;
  cccd?: string;
}

export interface ServiceInput {
  id?: string;
  name?: string;
  category?: string;
  price?: number;
  duration?: number;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  commission_percentage?: number;
  commission_amount?: number;
}

export interface PackageInput {
  id?: string;
  name?: string;
  service_id?: string;
  buy_count?: number;
  free_count?: number;
  price?: number;
  commission_percentage?: number;
  is_active?: boolean;
  services?: any[];
}

export interface BankInput {
  bank_id?: string;
  bank_name?: string;
  account_number?: string;
  account_owner?: string;
}

export interface SeoInput {
  page_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image_url?: string;
  logo_url?: string;
  online_discount_enabled?: boolean;
  online_discount_percent?: number;
  default_commission_percent?: number;
  hotline?: string;
  facebook_url?: string;
  zalo_url?: string;
}

export interface BannerInput {
  is_enabled?: boolean;
  content?: string;
}

export interface StaffReportEntry {
  staffId: string;
  fullName: string;
  username: string;
  totalAppointments: number;
  totalSales: number;
  totalCommission: number;
  totalTip: number;
  items: Array<{
    id: string;
    startTime: string;
    customerName: string;
    sales: number;
    commission: number;
    tip: number;
    services: string[];
  }>;
}

export interface CashInput {
  type: 'THU' | 'CHI';
  category: string;
  amount: number;
  description?: string;
  reference_type?: string;
  reference_id?: string;
}

export interface StaffPayrollInfo {
  id: string;
  fullName: string;
  username: string;
  role: string;
  isActive: boolean;
  baseSalary: number;
  bankAccount: string | null;
  bankName: string | null;
}

export interface PayrollStaffRow {
  staffId: string;
  fullName: string;
  baseSalary: number;
  totalCommission: number;
  totalTips: number;
  totalPackageCommission: number;
  totalSales: number;
  appointmentCount: number;
  absentDays: number;
  workingDays: number;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  fullName: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  totalCommission: number;
  totalTips: number;
  totalPackageCommission: number;
  bonus: number;
  deduction: number;
  advance: number;
  netPay: number;
  status: string;
  notes: string | null;
  paidAt: string | null;
}
