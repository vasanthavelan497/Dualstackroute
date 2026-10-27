import {
  NetworkTopology,
  Device,
  Link,
  LinkUpdate,
  RouteRequest,
  RouteResponse,
  IPValidationResponse,
  ExperimentListItem,
  ExperimentDetail,
  ExperimentCreate,
  ExperimentCompareResponse,
} from '../types/network';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Health
  checkHealth: async () => {
    return request<{ status: string; service: string; version: string }>('/health');
  },

  // Topology
  getTopology: async (): Promise<NetworkTopology> => {
    return request<NetworkTopology>('/topology');
  },

  getDevice: async (deviceId: string): Promise<Device> => {
    return request<Device>(`/topology/devices/${deviceId}`);
  },

  getLink: async (linkId: string): Promise<Link> => {
    return request<Link>(`/topology/links/${linkId}`);
  },

  updateLink: async (linkId: string, update: LinkUpdate): Promise<Link> => {
    return request<Link>(`/topology/links/${linkId}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  },

  failLink: async (linkId: string): Promise<Link> => {
    return request<Link>(`/topology/links/${linkId}/fail`, {
      method: 'POST',
    });
  },

  restoreLink: async (linkId: string): Promise<Link> => {
    return request<Link>(`/topology/links/${linkId}/restore`, {
      method: 'POST',
    });
  },

  resetTopology: async (): Promise<NetworkTopology> => {
    return request<NetworkTopology>('/topology/reset', {
      method: 'POST',
    });
  },

  // Routing
  calculateRoute: async (req: RouteRequest): Promise<RouteResponse> => {
    return request<RouteResponse>('/routing/calculate', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  // IP Validation
  validateIP: async (address: string, expectedVersion?: number): Promise<IPValidationResponse> => {
    return request<IPValidationResponse>('/ip/validate', {
      method: 'POST',
      body: JSON.stringify({ address, expected_version: expectedVersion }),
    });
  },

  // Experiments
  listExperiments: async (category?: string, search?: string): Promise<ExperimentListItem[]> => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<ExperimentListItem[]>(`/experiments${qs}`);
  },

  createExperiment: async (data: ExperimentCreate): Promise<ExperimentDetail> => {
    return request<ExperimentDetail>('/experiments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getExperiment: async (id: string): Promise<ExperimentDetail> => {
    return request<ExperimentDetail>(`/experiments/${id}`);
  },

  deleteExperiment: async (id: string): Promise<{ message: string; id: string }> => {
    return request<{ message: string; id: string }>(`/experiments/${id}`, {
      method: 'DELETE',
    });
  },

  clearAllExperiments: async (): Promise<{ message: string }> => {
    return request<{ message: string }>('/experiments', {
      method: 'DELETE',
    });
  },

  compareExperiments: async (experimentIds: string[]): Promise<ExperimentCompareResponse> => {
    return request<ExperimentCompareResponse>('/experiments/compare', {
      method: 'POST',
      body: JSON.stringify({ experiment_ids: experimentIds }),
    });
  },

  getExportCsvUrl: () => `${API_BASE}/experiments/export/csv`,
};
