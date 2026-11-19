export interface CustomerLookupResult {
  isExisting: boolean;
  customer?: {
    id: string;
    fullName: string;
    phone: string;
  };
  recentServices?: {
    id: string;
    name: string;
    category: string;
    date: string;
  }[];
}

export interface ServiceSuggestion {
  serviceId: string;
  serviceName: string;
  category: string;
  price: number;
  duration: number;
  reason: string;
}

export interface AiBookingRecommendation {
  welcomeMessage: string;
  suggestions: ServiceSuggestion[];
}

export interface StaffWithAttendance {
  id: string;
  fullName: string;
  role: string;
  isAvailableToday: boolean;
  hasCheckedIn: boolean;
  checkInTime?: string;
}
