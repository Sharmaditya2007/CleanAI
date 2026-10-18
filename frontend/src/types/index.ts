export type UserRole = 'officer' | 'owner' | 'citizen';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  organization?: string;
  is_active: boolean;
  created_at: string;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
}

export interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: BoundingBox;
  is_dirty_indicator: boolean;
}

export interface AIInferenceResult {
  success: boolean;
  model_identifier: string;
  framework: string;
  total_detections: number;
  detections: Detection[];
  clean_indicators_detected: string[];
  dirty_indicators_detected: string[];
  ai_recommendation: 'Clean' | 'Needs Cleaning' | 'Under Maintenance' | 'Inconclusive - Officer Inspection Required';
  confidence_summary: Record<string, number>;
  message: string;
  processed_at: string;
  annotated_image_url?: string;
  raw_image_url?: string;
  saved_filename?: string;
}

export type ToiletVerifiedStatus = 'Clean' | 'Needs Cleaning' | 'Under Maintenance' | 'Verification Pending';
export type ToiletRegistrationStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Suspended';

export interface Toilet {
  id: string;
  name: string;
  address: string;
  city: string;
  locality: string;
  latitude: number;
  longitude: number;
  description?: string;
  facilities: string[];
  opening_hours?: string;
  accessibility: boolean;
  access_type: 'public' | 'private' | 'paid';
  contact_number?: string;
  owner_id: string;
  owner_name?: string;
  registration_status: ToiletRegistrationStatus;
  rejection_reason?: string;
  verified_status: ToiletVerifiedStatus;
  last_inspected_at?: string;
  last_cleaned_at?: string;
  is_stale: boolean;
  rating: number;
  total_complaints: number;
  distance_km?: number;
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: string;
  toilet_id: string;
  toilet_name?: string;
  image_url: string;
  model_identifier: string;
  ai_raw_output: any;
  ai_recommendation: string;
  officer_decision: 'Clean' | 'Needs Cleaning' | 'Under Maintenance';
  is_override: boolean;
  override_reason?: string;
  inspector_id: string;
  inspector_name: string;
  inspection_status: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  reference_number: string;
  toilet_id: string;
  toilet_name?: string;
  user_id?: string;
  reporter_email?: string;
  category: 'dirty_toilet' | 'dirty_floor' | 'missing_water' | 'broken_facility' | 'closed' | 'wrong_location' | 'other';
  description: string;
  photo_url?: string;
  status: 'Open' | 'Received' | 'In Progress' | 'Under Investigation' | 'Action Taken' | 'Resolved';
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CleaningTask {
  id: string;
  toilet_id: string;
  toilet_name?: string;
  assigned_to_owner_id: string;
  assigned_to_owner_name?: string;
  assigned_by_id: string;
  assigned_by_name?: string;
  status: 'Pending' | 'In Progress' | 'Cleaning Reported' | 'Verification Pending' | 'Verified' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  notes?: string;
  completion_notes?: string;
  after_photo_url?: string;
  claimed_at?: string;
  verified_at?: string;
  created_at: string;
}

export interface MunicipalAnalytics {
  total_toilets: number;
  clean_toilets: number;
  needs_cleaning_toilets: number;
  under_maintenance_toilets: number;
  pending_approval_toilets: number;
  pending_inspections: number;
  completed_inspections: number;
  open_complaints: number;
  resolved_complaints: number;
  overdue_tasks: number;
  active_cleaning_tasks: number;
  cleanliness_rate: number;
  recent_inspections_trend: {
    day: string;
    inspections: number;
    clean: number;
    needs_cleaning: number;
  }[];
  frequent_issue_categories: {
    category: string;
    count: number;
  }[];
  locality_breakdown: {
    locality: string;
    total: number;
  }[];
}

export interface HealthInfo {
  status: string;
  service: string;
  version: string;
  model: {
    loaded: boolean;
    path: string;
    filename: string;
    framework: string;
    classes_count: number;
    classes: Record<string, string>;
    load_error?: string;
  };
  database: {
    type: string;
    connected: boolean;
    database_name: string;
  };
}

export interface Notification {
  id: string;
  user_id?: string;
  target_role?: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

