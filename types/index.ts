export type Language = 'en' | 'hi' | 'ta';

export type SchemeCategory =
  | 'scholarship'
  | 'pension'
  | 'healthcare'
  | 'housing'
  | 'farmer'
  | 'employment'
  | 'business'
  | 'subsidy'
  | 'insurance'
  | 'tax'
  | 'women'
  | 'disability'
  | 'senior';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  date_of_birth: string | null;
  gender: string;
  community_category: string;
  annual_income: number;
  occupation: string;
  education: string;
  disability_status: boolean;
  state: string;
  district: string;
  pincode: string;
  address: string;
  preferred_language: Language;
  avatar_url: string;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  full_name: string;
  relationship: string;
  date_of_birth: string | null;
  gender: string;
  community_category: string;
  occupation: string;
  education: string;
  disability_status: boolean;
  created_at: string;
}

export interface Scheme {
  id: string;
  name: string;
  name_hi: string;
  name_ta: string;
  description: string;
  description_hi: string;
  description_ta: string;
  category: SchemeCategory;
  ministry: string;
  level: string;
  state: string;
  benefits: string;
  eligibility: Record<string, any>;
  documents_required: string[];
  application_url: string;
  deadline: string;
  estimated_days: number;
  tags: string[];
  is_active: boolean;
}

export interface Document {
  id: string;
  user_id: string;
  type: string;
  title: string;
  number: string;
  issue_date: string | null;
  expiry_date: string | null;
  status: 'verified' | 'pending' | 'missing' | 'expired';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  scheme_id: string | null;
  scheme_name: string;
  status: 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'pending-docs';
  predicted_approval: number;
  missing_documents: string[];
  notes: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  department: string;
  status: 'submitted' | 'routed' | 'in-progress' | 'resolved' | 'rejected';
  priority: 'low' | 'normal' | 'high';
  tracking_id: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'deadline' | 'approval' | 'document' | 'announcement' | 'scam-alert';
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high';
  is_read: boolean;
  action_url: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  language: Language;
  created_at: string;
}

export interface Office {
  id: string;
  name: string;
  type: string;
  address: string;
  district: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  services: string[];
  timings: string;
  phone: string;
  estimated_wait_mins: number;
}
