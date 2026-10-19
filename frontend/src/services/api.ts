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

export const DEFAULT_PRODUCTION_API = 'https://cleanai-6pwl.onrender.com/api';

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('clean_ai_custom_api_url');
    if (custom && custom.trim()) {
      const clean = custom.trim();
      return clean.endsWith('/api') ? clean : `${clean.replace(/\/$/, '')}/api`;
    }
  }
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim()) {
    const clean = envUrl.trim();
    return clean.endsWith('/api') ? clean : `${clean.replace(/\/$/, '')}/api`;
  }
  
  // When running on a remote deployed domain like Vercel, default directly to Render backend
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return DEFAULT_PRODUCTION_API;
  }

  return '/api';
}

export function setCustomApiUrl(url: string | null) {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('clean_ai_custom_api_url', url.trim());
    } else {
      localStorage.removeItem('clean_ai_custom_api_url');
    }
  }
}

export function getCustomApiUrl(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('clean_ai_custom_api_url');
  }
  return null;
}

export const API_BASE = getApiBase();

export function getMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = getApiBase();
  if (base.startsWith('http://') || base.startsWith('https://')) {
    const origin = base.replace(/\/api\/?$/, '');
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
}

function getHeaders(isFormData = false): HeadersInit {
  const headers: Record<string, string> = {
    'Bypass-Tunnel-Reminder': 'true'
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('clean_ai_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const isRemote = typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  const updatedInit: RequestInit = { ...init };
  const headers = new Headers(updatedInit.headers || {});
  if (!headers.has('Bypass-Tunnel-Reminder')) {
    headers.set('Bypass-Tunnel-Reminder', 'true');
  }
  updatedInit.headers = headers;

  try {
    return await fetch(input, updatedInit);
  } catch (err: any) {
    // If on remote (Vercel) and relative /api call failed, automatically retry directly against Render backend
    if (isRemote && typeof input === 'string' && input.startsWith('/api')) {
      try {
        const directUrl = `${DEFAULT_PRODUCTION_API}${input.replace(/^\/api/, '')}`;
        return await fetch(directUrl, updatedInit);
      } catch {
        // Fall through
      }
    }

    // If on localhost and relative proxy failed, attempt direct connection to backend port 8000
    if (!isRemote && typeof input === 'string' && input.startsWith('/api')) {
      try {
        const directUrl = `http://127.0.0.1:8000${input}`;
        return await fetch(directUrl, init);
      } catch {
        // Fall through
      }
    }
    const message = err?.message || '';
    if (message.toLowerCase().includes('fetch') || message.toLowerCase().includes('network')) {
      if (isRemote) {
        throw new Error(
          'Unable to reach Clean AI backend from Vercel. Please link your deployed backend URL in Vercel environment variables (VITE_API_URL) or in the Cloud Settings modal.'
        );
      }
      throw new Error('Unable to connect to Clean AI backend. Please verify the backend is running on port 8000.');
    }
    throw err;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const isRemote = typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';

    if (isRemote) {
      throw new Error(
        'Backend API unlinked on Vercel: Vercel served frontend HTML instead of API data. Please set VITE_API_URL in your Vercel Project Settings (e.g. your Render backend URL) or click the Cloud Connection button in the top bar.'
      );
    }
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}: ${res.statusText || 'Error'}`);
    }
    throw new Error('API returned non-JSON response.');
  }
  if (!res.ok) {
    let errorDetail = `Request failed (HTTP ${res.status})`;
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
    const res = await safeFetch(`${getApiBase()}/health`);
    return handleResponse<HealthInfo>(res);
  },

  // Auth
  login: async (email: string, password: string): Promise<{ access_token: string; user: User }> => {
    const res = await safeFetch(`${getApiBase()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password })
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
    invite_code?: string;
  }): Promise<{ access_token: string; user: User }> => {
    const res = await safeFetch(`${getApiBase()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        email: data.email.trim().toLowerCase(),
        full_name: data.full_name.trim()
      })
    });
    return handleResponse(res);
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string; reset_token?: string }> => {
    const res = await safeFetch(`${getApiBase()}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });
    return handleResponse(res);
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const res = await safeFetch(`${getApiBase()}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.trim(), new_password: newPassword })
    });
    return handleResponse(res);
  },

  getMe: async (): Promise<User> => {
    const res = await safeFetch(`${getApiBase()}/auth/me`, {
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
    const res = await safeFetch(`${getApiBase()}/toilets?${query.toString()}`, {
      headers: getHeaders()
    });
    return handleResponse<Toilet[]>(res);
  },

  getToilet: async (id: string): Promise<Toilet> => {
    const res = await safeFetch(`${getApiBase()}/toilets/${id}`, {
      headers: getHeaders()
    });
    return handleResponse<Toilet>(res);
  },

  registerToilet: async (toiletData: Partial<Toilet>): Promise<Toilet> => {
    const res = await safeFetch(`${getApiBase()}/toilets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(toiletData)
    });
    return handleResponse<Toilet>(res);
  },

  updateToilet: async (id: string, updates: Partial<Toilet>): Promise<Toilet> => {
    const res = await safeFetch(`${getApiBase()}/toilets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse<Toilet>(res);
  },

  approveToilet: async (id: string): Promise<Toilet> => {
    const res = await safeFetch(`${getApiBase()}/toilets/${id}/approve`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse<Toilet>(res);
  },

  rejectToilet: async (id: string, reason: string): Promise<Toilet> => {
    const res = await safeFetch(`${getApiBase()}/toilets/${id}/reject`, {
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
    const res = await safeFetch(`${getApiBase()}/ai/inspect`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse<AIInferenceResult>(res);
  },

  runSampleTest: async (): Promise<AIInferenceResult> => {
    const res = await safeFetch(`${getApiBase()}/ai/sample-test`, {
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
    const res = await safeFetch(`${getApiBase()}/inspections/confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<Inspection>(res);
  },

  getInspections: async (toiletId?: string): Promise<Inspection[]> => {
    const url = toiletId ? `${getApiBase()}/inspections?toilet_id=${toiletId}` : `${getApiBase()}/inspections`;
    const res = await safeFetch(url, { headers: getHeaders() });
    return handleResponse<Inspection[]>(res);
  },

  // Cleaning Tasks
  getTasks: async (toiletId?: string): Promise<CleaningTask[]> => {
    const url = toiletId ? `${getApiBase()}/tasks?toilet_id=${toiletId}` : `${getApiBase()}/tasks`;
    const res = await safeFetch(url, { headers: getHeaders() });
    return handleResponse<CleaningTask[]>(res);
  },

  createTask: async (data: {
    toilet_id: string;
    priority?: string;
    notes?: string;
  }): Promise<CleaningTask> => {
    const res = await safeFetch(`${getApiBase()}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<CleaningTask>(res);
  },

  markTaskInProgress: async (taskId: string): Promise<CleaningTask> => {
    const res = await safeFetch(`${getApiBase()}/tasks/${taskId}/claim`, {
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
    const res = await safeFetch(`${getApiBase()}/tasks/${taskId}/complete`, {
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
    const res = await safeFetch(`${getApiBase()}/complaints`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse<Complaint>(res);
  },

  getComplaints: async (toiletId?: string): Promise<Complaint[]> => {
    const url = toiletId ? `${getApiBase()}/complaints?toilet_id=${toiletId}` : `${getApiBase()}/complaints`;
    const res = await safeFetch(url, { headers: getHeaders() });
    return handleResponse<Complaint[]>(res);
  },

  trackComplaint: async (referenceNumber: string): Promise<Complaint> => {
    const res = await safeFetch(`${getApiBase()}/complaints/track/${referenceNumber}`);
    return handleResponse<Complaint>(res);
  },

  updateComplaintStatus: async (
    complaintId: string,
    status: string,
    resolutionNotes?: string
  ): Promise<Complaint> => {
    const res = await safeFetch(`${getApiBase()}/complaints/${complaintId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, resolution_notes: resolutionNotes })
    });
    return handleResponse<Complaint>(res);
  },

  // Analytics
  getAnalytics: async (): Promise<MunicipalAnalytics> => {
    const res = await safeFetch(`${getApiBase()}/analytics`, {
      headers: getHeaders()
    });
    return handleResponse<MunicipalAnalytics>(res);
  },

  // Notifications
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const res = await safeFetch(`${getApiBase()}/notifications`, {
        headers: getHeaders()
      });
      return await handleResponse<Notification[]>(res);
    } catch {
      return [];
    }
  },

  markNotificationRead: async (notificationId: string): Promise<any> => {
    const res = await safeFetch(`${getApiBase()}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse<any>(res);
  },

  markAllNotificationsRead: async (): Promise<any> => {
    const res = await safeFetch(`${getApiBase()}/notifications/mark-all-read`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse<any>(res);
  }
};
