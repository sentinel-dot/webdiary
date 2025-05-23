// frontend/src/lib/api.ts
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  timestamp: string;
}

interface Computer {
  id: number;
  name: string;
  ip_address: string;
  status: string;
  status_note: string;
  installed_version: string;
  created_at?: string;
  updated_at?: string;
}

interface User {
  id: number;
  username: string;
  role: 'admin-user' | 'privileged-user' | 'viewer-user';
}

interface LoginResponse {
  user: User;
  token: string;
  expires_in: number;
  token_type: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: ApiResponse
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class TokenManager {
  private static readonly TOKEN_KEY = 'authToken';
  private static readonly USER_KEY = 'authUser';

  static setToken(token: string | null) {
    if (typeof window === 'undefined') return;
    
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setUser(user: User | null) {
    if (typeof window === 'undefined') return;
    
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.USER_KEY);
    }
  }

  static getUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  static clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}

class ApiClient {
  private baseUrl: string;
  private requestInterceptors: Array<(config: RequestInit) => RequestInit> = [];
  private responseInterceptors: Array<(response: Response) => Response | Promise<Response>> = [];

  constructor(baseUrl: string = 'http://localhost:8080/api') {
    this.baseUrl = baseUrl;
    this.setupDefaultInterceptors();
  }

  private setupDefaultInterceptors() {
    // Request interceptor for auth token
    this.requestInterceptors.push((config) => {
      const token = TokenManager.getToken();
      if (token && !TokenManager.isTokenExpired(token)) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        };
      }
      return config;
    });

    // Response interceptor for token expiration
    this.responseInterceptors.push(async (response) => {
      if (response.status === 401) {
        TokenManager.clear();
        // Redirect to login if not already there
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      return response;
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    let config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = interceptor(config);
    }

    try {
      let response = await fetch(url, config);

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response);
      }

      const contentType = response.headers.get('content-type');
      let data: ApiResponse<T>;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = {
          success: response.ok,
          message: text || 'Unbekannte Antwort vom Server',
          timestamp: new Date().toISOString()
        };
      }

      if (!response.ok) {
        throw new ApiError(
          data.message || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or parsing errors
      throw new ApiError(
        'Netzwerkfehler oder Serverproblem',
        0
      );
    }
  }

  // Auth methods
  async login(credentials: { username: string; password: string }): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>('/login.php', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      TokenManager.setToken(response.data.token);
      TokenManager.setUser(response.data.user);
    }

    return response;
  }

  async register(userData: { username: string; password: string }): Promise<ApiResponse> {
    return this.request('/register.php', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  logout() {
    TokenManager.clear();
  }

  // Computer methods
  async getComputers(): Promise<ApiResponse<Computer[]>> {
    return this.request<Computer[]>('/get_FEs.php');
  }

  async updateComputerStatus(
    computerIds: number[], 
    status: string, 
    statusNote?: string
  ): Promise<ApiResponse> {
    return this.request('/update_status.php', {
      method: 'POST',
      body: JSON.stringify({
        computer_ids: computerIds,
        status,
        status_note: statusNote || '',
      }),
    });
  }

  async updateComputerVersion(
    computerIds: number[], 
    version: string
  ): Promise<ApiResponse> {
    return this.request('/update_version.php', {
      method: 'POST',
      body: JSON.stringify({
        computer_ids: computerIds,
        version,
      }),
    });
  }

  async rebootComputers(computerIds: number[]): Promise<ApiResponse> {
    return this.request('/system_reboot.php', {
      method: 'POST',
      body: JSON.stringify({
        computer_ids: computerIds,
      }),
    });
  }

  async getComputerDetails(computerId: number): Promise<ApiResponse<Computer>> {
    return this.request<Computer>(`/get_computer_details.php?id=${computerId}`);
  }

  // Admin methods
  async importComputersFromExcel(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('excel_file', file);

    const token = TokenManager.getToken();
    const response = await fetch(`${this.baseUrl}/import_computers.php`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    return response.json();
  }

  async createComputer(computerData: Omit<Computer, 'id'>): Promise<ApiResponse> {
    return this.request('/create_computer.php', {
      method: 'POST',
      body: JSON.stringify(computerData),
    });
  }

  async deleteComputers(computerIds: number[]): Promise<ApiResponse> {
    return this.request('/delete_computers.php', {
      method: 'DELETE',
      body: JSON.stringify({ computer_ids: computerIds }),
    });
  }

  // Utility methods
  getCurrentUser(): User | null {
    return TokenManager.getUser();
  }

  isAuthenticated(): boolean {
    const token = TokenManager.getToken();
    return token ? !TokenManager.isTokenExpired(token) : false;
  }

  hasRole(requiredRole: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const roleHierarchy = {
      'viewer-user': 1,
      'privileged-user': 2,
      'admin-user': 3
    };
    
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    
    return userLevel >= requiredLevel;
  }

  // Interceptor methods
  addRequestInterceptor(interceptor: (config: RequestInit) => RequestInit) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>) {
    this.responseInterceptors.push(interceptor);
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Export types and classes
export { 
  ApiError, 
  TokenManager,
  type Computer, 
  type User, 
  type ApiResponse, 
  type LoginResponse 
};