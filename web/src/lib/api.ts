import { 
  Decision, 
  DecisionHistory, 
  DecisionListResponse, 
  CreateDecisionInput,
  LoginCredentials 
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(credentials: LoginCredentials): Promise<{ token: string }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Health
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health');
  }

  // Decisions
  async listDecisions(params?: {
    search?: string;
    is_superseded?: boolean;
    created_after?: string;
    created_before?: string;
    limit?: number;
    offset?: number;
  }): Promise<DecisionListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request(`/api/decisions${query ? `?${query}` : ''}`);
  }

  async getDecision(id: string): Promise<Decision> {
    return this.request(`/api/decisions/${id}`);
  }

  async getDecisionHistory(id: string): Promise<DecisionHistory> {
    return this.request(`/api/decisions/${id}/history`);
  }

  async createDecision(input: CreateDecisionInput): Promise<Decision> {
    return this.request('/api/decisions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async supersedeDecision(id: string, input: CreateDecisionInput): Promise<Decision> {
    return this.request(`/api/decisions/${id}/supersede`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
}

export const api = new ApiClient();
export default api;
