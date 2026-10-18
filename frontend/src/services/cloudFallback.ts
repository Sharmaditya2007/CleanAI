import { Toilet, MunicipalAnalytics, HealthInfo, User } from '../types';

export const SEED_TOILETS: Toilet[] = [
  {
    id: "tlt_001",
    name: "Connaught Place Block B Public Convenience",
    address: "Inner Circle, Block B, Connaught Place",
    city: "New Delhi",
    locality: "Connaught Place",
    latitude: 28.6315,
    longitude: 77.2167,
    description: "Modern public smart toilet facility with automatic sensor taps and handicap ramp.",
    facilities: ["Running Water", "Washbasin", "Western WC", "Indian Squat", "Soap Dispenser", "Accessible Ramp"],
    opening_hours: "06:00 - 23:00",
    accessibility: true,
    access_type: "public",
    contact_number: "+91-11-23344556",
    owner_id: "usr_owner_01",
    owner_name: "Suresh Patel",
    registration_status: "Approved",
    verified_status: "Clean",
    last_inspected_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    last_cleaned_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    is_stale: false,
    rating: 4.6,
    total_complaints: 0,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600000).toISOString()
  },
  {
    id: "tlt_002",
    name: "Rajiv Chowk Metro Station Gate 2 Toilet",
    address: "Gate No. 2, Rajiv Chowk Concourse",
    city: "New Delhi",
    locality: "Rajiv Chowk",
    latitude: 28.6328,
    longitude: 77.2195,
    description: "High-footfall transit sanitation complex. Equipped with sanitary napkin vending machine.",
    facilities: ["Running Water", "Washbasin", "Urinals", "Western WC", "Sanitary Vending", "Accessible Ramp"],
    opening_hours: "05:30 - 23:30",
    accessibility: true,
    access_type: "public",
    contact_number: "+91-11-23348899",
    owner_id: "usr_owner_01",
    owner_name: "Suresh Patel",
    registration_status: "Approved",
    verified_status: "Needs Cleaning",
    last_inspected_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    last_cleaned_at: new Date(Date.now() - 7 * 3600000).toISOString(),
    is_stale: false,
    rating: 3.4,
    total_complaints: 2,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600000).toISOString()
  },
  {
    id: "tlt_003",
    name: "Janpath Central Market Public Facility",
    address: "Opposite Janpath Tibetan Market, Janpath Road",
    city: "New Delhi",
    locality: "Janpath",
    latitude: 28.6258,
    longitude: 77.2185,
    description: "Public toilet facility serving shoppers and tourists. Continuous water supply.",
    facilities: ["Running Water", "Indian Squat", "Urinals", "Washbasin"],
    opening_hours: "07:00 - 22:00",
    accessibility: false,
    access_type: "public",
    contact_number: "+91-11-23311223",
    owner_id: "usr_owner_01",
    owner_name: "Suresh Patel",
    registration_status: "Approved",
    verified_status: "Clean",
    last_inspected_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    last_cleaned_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    is_stale: false,
    rating: 4.1,
    total_complaints: 1,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: "tlt_004",
    name: "Barakhamba Road Transit Restroom",
    address: "Near Barakhamba Metro Exit Gate 4",
    city: "New Delhi",
    locality: "Barakhamba",
    latitude: 28.6300,
    longitude: 77.2274,
    description: "Civic toilet block undergoing pipe replacement and fixture re-tiling.",
    facilities: ["Running Water", "Western WC", "Urinals"],
    opening_hours: "06:00 - 22:00",
    accessibility: true,
    access_type: "public",
    contact_number: "+91-11-23388771",
    owner_id: "usr_owner_01",
    owner_name: "Suresh Patel",
    registration_status: "Approved",
    verified_status: "Under Maintenance",
    last_inspected_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    last_cleaned_at: new Date(Date.now() - 26 * 3600000).toISOString(),
    is_stale: false,
    rating: 3.9,
    total_complaints: 0,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString()
  },
  {
    id: "tlt_005",
    name: "India Gate Children's Park Restroom",
    address: "Rajpath lawns, near Children's Park",
    city: "New Delhi",
    locality: "India Gate",
    latitude: 28.6129,
    longitude: 77.2295,
    description: "High visibility civic facility with dedicated female and male complexes and baby care station.",
    facilities: ["Running Water", "Washbasin", "Western WC", "Indian Squat", "Baby Changing", "Accessible Ramp"],
    opening_hours: "06:00 - 23:00",
    accessibility: true,
    access_type: "public",
    contact_number: "+91-11-23377112",
    owner_id: "usr_owner_01",
    owner_name: "Suresh Patel",
    registration_status: "Approved",
    verified_status: "Clean",
    last_inspected_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    last_cleaned_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    is_stale: false,
    rating: 4.8,
    total_complaints: 0,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: "tlt_006",
    name: "Paharganj Main Bazaar New Community Toilet",
    address: "Main Bazaar Road, Near Imperial Cinema",
    city: "New Delhi",
    locality: "Paharganj",
    latitude: 28.6412,
    longitude: 77.2140,
    description: "Newly constructed municipal facility submitted for official verification.",
    facilities: ["Running Water", "Washbasin", "Urinals", "Indian Squat"],
    opening_hours: "24x7",
    accessibility: true,
    access_type: "public",
    contact_number: "+91-11-23588990",
    owner_id: "usr_owner_01",
    owner_name: "Suresh Patel",
    registration_status: "Pending Approval",
    verified_status: "Verification Pending",
    is_stale: true,
    rating: 4.0,
    total_complaints: 0,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600000).toISOString()
  }
];

export const cloudFallback = {
  getHealth: (): HealthInfo => ({
    status: "healthy",
    service: "Clean AI — Public Toilet Cleanliness Platform (Cloud Preview)",
    version: "1.0.0",
    model: {
      loaded: true,
      path: "clean ai/results/clean_ai_floor_v2/weights/best.pt",
      filename: "best.pt",
      framework: "Ultralytics YOLO (Object Detection)",
      classes_count: 16,
      classes: {
        "0": "clean_basin", "1": "clean_floor", "2": "clean_indian", "3": "clean_urinal",
        "4": "clean_western", "5": "damage", "6": "dirty_basin", "7": "dirty_floor",
        "8": "dirty_indian", "9": "dirty_urinal", "10": "dirty_western", "11": "garbage",
        "12": "partial_dirty_floor", "13": "partial_dirty_indian", "14": "partial_dirty_urinal", "15": "partial_dirty_western"
      }
    },
    database: {
      type: "Persistent Embedded Store",
      connected: true,
      database_name: "clean_ai_database"
    }
  }),

  register: (data: { email: string; full_name: string; role: string; password?: string }): { access_token: string; user: User } => {
    const userId = `usr_${Math.random().toString(36).substring(2, 10)}`;
    const user: User = {
      id: userId,
      email: data.email.toLowerCase(),
      full_name: data.full_name || 'Clean AI Citizen',
      role: (data.role as any) || 'citizen',
      is_active: true,
      created_at: new Date().toISOString()
    };
    const token = `clean_ai_token_${userId}`;
    localStorage.setItem('clean_ai_current_user', JSON.stringify(user));
    localStorage.setItem('clean_ai_token', token);
    return { access_token: token, user };
  },

  login: (email: string, _password?: string): { access_token: string; user: User } => {
    const lower = email.toLowerCase();
    let role = 'citizen';
    let fullName = 'Priya Sharma (Citizen)';

    if (lower.includes('officer')) {
      role = 'officer';
      fullName = 'Rajesh Kumar (Municipal Officer)';
    } else if (lower.includes('owner')) {
      role = 'owner';
      fullName = 'Suresh Patel (Facility Contractor)';
    } else {
      const saved = localStorage.getItem('clean_ai_current_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.email === lower) {
            return { access_token: `clean_ai_token_${parsed.id}`, user: parsed };
          }
        } catch {}
      }
      fullName = email.split('@')[0] || 'Clean AI User';
    }

    const userId = `usr_${role}_01`;
    const user: User = {
      id: userId,
      email: lower,
      full_name: fullName,
      role: role as any,
      organization: role === 'officer' ? 'Delhi Municipal Corporation' : role === 'owner' ? 'Urban Sanitation Ltd.' : undefined,
      is_active: true,
      created_at: new Date().toISOString()
    };
    const token = `clean_ai_token_${userId}`;
    localStorage.setItem('clean_ai_current_user', JSON.stringify(user));
    localStorage.setItem('clean_ai_token', token);
    return { access_token: token, user };
  },

  getCurrentUser: (): User => {
    const saved = localStorage.getItem('clean_ai_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      id: "usr_citizen_01",
      email: "citizen@cleanai.org",
      full_name: "Priya Sharma (Citizen)",
      role: "citizen",
      phone: "+91-9988776655",
      is_active: true,
      created_at: new Date().toISOString()
    };
  },

  getToilets: (): Toilet[] => {
    const local = localStorage.getItem('clean_ai_toilets');
    if (local) {
      try { return JSON.parse(local); } catch {}
    }
    return SEED_TOILETS;
  },

  getAnalytics: (): MunicipalAnalytics => ({
    total_toilets: 6,
    clean_toilets: 3,
    needs_cleaning_toilets: 1,
    under_maintenance_toilets: 1,
    pending_approval_toilets: 1,
    pending_inspections: 2,
    completed_inspections: 14,
    open_complaints: 1,
    resolved_complaints: 2,
    overdue_tasks: 0,
    active_cleaning_tasks: 3,
    cleanliness_rate: 84.5,
    recent_inspections_trend: [
      { day: "Mon", inspections: 4, clean: 3, needs_cleaning: 1 },
      { day: "Tue", inspections: 6, clean: 5, needs_cleaning: 1 },
      { day: "Wed", inspections: 3, clean: 2, needs_cleaning: 1 },
      { day: "Thu", inspections: 8, clean: 7, needs_cleaning: 1 },
      { day: "Fri", inspections: 5, clean: 4, needs_cleaning: 1 },
      { day: "Sat", inspections: 9, clean: 8, needs_cleaning: 1 },
      { day: "Sun", inspections: 7, clean: 6, needs_cleaning: 1 }
    ],
    frequent_issue_categories: [
      { category: "dirty_floor", count: 12 },
      { category: "dirty_western", count: 8 },
      { category: "dirty_urinal", count: 6 },
      { category: "missing_water", count: 4 }
    ],
    locality_breakdown: [
      { locality: "Connaught Place", total: 1 },
      { locality: "Rajiv Chowk", total: 1 },
      { locality: "Janpath", total: 1 },
      { locality: "Barakhamba", total: 1 },
      { locality: "India Gate", total: 1 },
      { locality: "Paharganj", total: 1 }
    ]
  })
};
