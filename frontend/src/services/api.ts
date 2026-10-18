import {
  User,
  Toilet,
  AIInferenceResult,
  Inspection,
  Complaint,
  CleaningTask,
  MunicipalAnalytics,
  HealthInfo,
  Notification
} from '../types';

const ENV_API_URL = import.meta.env.VITE_API_URL as string | undefined;
export const API_BASE = ENV_API_URL
  ? (ENV_API_URL.endsWith('/api') ? ENV_API_URL : `${ENV_API_URL.replace(/\/$/, '')}/api`)
  : '/api';

export function getMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!ENV_API_URL) return path;
  const origin = ENV_API_URL.replace(/\/api\/?$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

function getHeaders(isFormData = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('clean_ai_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('API returned non-JSON response (endpoint may not exist on this host).');
  }
  if (!res.ok) {
    let errorDetail = 'Network response was not ok';
    try {
      const errJson = await res.json();
      if (Array.isArray(errJson.detail)) {
        errorDetail = errJson.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      } else {
        errorDetail = errJson.detail || errJson.message || errorDetail;
      }
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Health
  getHealth: async (): Promise<HealthInfo> => {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<HealthInfo>(res);
  },

  // Auth
  login: async (email: string, password: string): Promise<{ access_token: string; user: User }> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  register: async (data: {
    email: string;
    full_name: string;
    password: string;
    role: string;
    phone?: string;
    organization?: string;
  }): Promise<{ access_token: string; user: User }> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getMe: async (): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse<User>(res);
  },

  // Toilets
  getToilets: async (params?: {
    status?: string;
    registration_status?: string;
    search?: string;
    accessible?: boolean;
    lat?: number;
    lon?: number;
    max_distance_km?: number;
    owner_only?: boolean;
  }): Promise<Toilet[]> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, String(v));
        }
      });
    }
    const res = await fetch(`${API_BASE}/toilets?${query.toString()}`, {
      headers: getHeaders()
    });
    return handleResponse<Toilet[]>(res);
  },

  getToilet: async (id: string): Promise<Toilet> => {
    const res = await fetch(`${API_BASE}/toilets/${id}`, {
      headers: getHeaders()
    });
    return handleResponse<Toilet>(res);
  },

  registerToilet: async (toiletData: Partial<Toilet>): Promise<Toilet> => {
    const res = await fetch(`${API_BASE}/toilets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(toiletData)
    });
    return handleResponse<Toilet>(res);
  },

  updateToilet: async (id: string, updates: Partial<Toilet>): Promise<Toilet> => {
    const res = await fetch(`${API_BASE}/toilets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse<Toilet>(res);
  },

  approveToilet: async (id: string): Promise<Toilet> => {
    const res = await fetch(`${API_BASE}/toilets/${id}/approve`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse<Toilet>(res);
  },

  rejectToilet: async (id: string, reason: string): Promise<Toilet> => {
    const res = await fetch(`${API_BASE}/toilets/${id}/reject`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleResponse<Toilet>(res);
  },

  // AI & Inspections
  inspectImage: async (file: File, toiletId?: string): Promise<AIInferenceResult> => {
    const formData = new FormData();
    formData.append('image', file);
    if (toiletId) {
      formData.append('toilet_id', toiletId);
    }
    const res = await fetch(`${API_BASE}/ai/inspect`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse<AIInferenceResult>(res);
  },

  runSampleTest: async (): Promise<AIInferenceResult> => {
    const res = await fetch(`${API_BASE}/ai/sample-test`, {
      headers: getHeaders()
    });
    return handleResponse<AIInferenceResult>(res);
  },

  confirmInspection: async (data: {
    toilet_id: string;
    image_filename?: string;
    ai_raw_output: any;
    ai_recommendation: string;
    officer_decision: 'Clean' | 'Needs Cleaning' | 'Under Maintenance';
    is_override: boolean;
    override_reason?: string;
  }): Promise<Inspection> => {
    const res = await fetch(`${API_BASE}/inspections/confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<Inspection>(res);
  },

  getInspections: async (toiletId?: string): Promise<Inspection[]> => {
    const url = toiletId ? `${API_BASE}/inspections?toilet_id=${toiletId}` : `${API_BASE}/inspections`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<Inspection[]>(res);
  },

  // Cleaning Tasks
  getTasks: async (toiletId?: string): Promise<CleaningTask[]> => {
    const url = toiletId ? `${API_BASE}/tasks?toilet_id=${toiletId}` : `${API_BASE}/tasks`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<CleaningTask[]>(res);
  },

  createTask: async (data: {
    toilet_id: string;
    priority?: string;
    notes?: string;
  }): Promise<CleaningTask> => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<CleaningTask>(res);
  },

  markTaskInProgress: async (taskId: string): Promise<CleaningTask> => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/claim`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse<CleaningTask>(res);
  },

  reportCleaningCompletion: async (
    taskId: string,
    notes: string,
    afterPhoto?: File
  ): Promise<CleaningTask> => {
    const formData = new FormData();
    formData.append('completion_notes', notes);
    if (afterPhoto) {
      formData.append('after_photo', afterPhoto);
    }
    const res = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse<CleaningTask>(res);
  },

  // Complaints
  submitComplaint: async (data: {
    toilet_id: string;
    category: string;
    description: string;
    reporter_email?: string;
    photo?: File;
  }): Promise<Complaint> => {
    const formData = new FormData();
    formData.append('toilet_id', data.toilet_id);
    formData.append('category', data.category);
    formData.append('description', data.description);
    if (data.reporter_email) {
      formData.append('reporter_email', data.reporter_email);
    }
    if (data.photo) {
      formData.append('photo', data.photo);
    }
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse<Complaint>(res);
  },

  getComplaints: async (toiletId?: string): Promise<Complaint[]> => {
    const url = toiletId ? `${API_BASE}/complaints?toilet_id=${toiletId}` : `${API_BASE}/complaints`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<Complaint[]>(res);
  },

  trackComplaint: async (referenceNumber: string): Promise<Complaint> => {
    const res = await fetch(`${API_BASE}/complaints/track/${referenceNumber}`);
    return handleResponse<Complaint>(res);
  },

  updateComplaintStatus: async (
    complaintId: string,
    status: string,
    resolutionNotes?: string
  ): Promise<Complaint> => {
    const res = await fetch(`${API_BASE}/complaints/${complaintId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, resolution_notes: resolutionNotes })
    });
    return handleResponse<Complaint>(res);
  },

  // Analytics
  getAnalytics: async (): Promise<MunicipalAnalytics> => {
    const res = await fetch(`${API_BASE}/analytics`, {
      headers: getHeaders()
    });
    return handleResponse<MunicipalAnalytics>(res);
  },

  // Notifications
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: getHeaders()
      });
      return await handleResponse<Notification[]>(res);
    } catch {
      return [];
    }
  },

  markNotificationRead: async (notificationId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse<any>(res);
  },

  markAllNotificationsRead: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse<any>(res);
  }
};
