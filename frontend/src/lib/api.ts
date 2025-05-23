// lib/api.ts
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
}

interface User {
  id: number;
  username: string;
  role: string;
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

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:8080/api') {
    this.baseUrl = baseUrl;
    // Load token from storage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

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

  // Auth endpoints
  async login(credentials: { username: string; password: string }) {
    return this.request<{ user: User; token: string }>('/login.php', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: { username: string; password: string }) {
    return this.request('/register.php', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Computer endpoints
  async getComputers() {
    return this.request<Computer[]>('/get_FEs.php');
  }

  async updateComputerStatus(computerIds: number[], status: string, statusNote?: string) {
    return this.request('/update_status.php', {
      method: 'POST',
      body: JSON.stringify({
        computer_ids: computerIds,
        status,
        status_note: statusNote || '',
      }),
    });
  }

  async updateComputerVersion(computerIds: number[], version: string) {
    return this.request('/update_version.php', {
      method: 'POST',
      body: JSON.stringify({
        computer_ids: computerIds,
        version,
      }),
    });
  }

  async rebootComputers(computerIds: number[]) {
    return this.request('/reboot_computers.php', {
      method: 'POST',
      body: JSON.stringify({
        computer_ids: computerIds,
      }),
    });
  }

  async getComputerDetails(computerId: number) {
    return this.request<Computer>(`/get_computer_details.php?id=${computerId}`);
  }

  // Admin endpoints
  async importComputersFromExcel(file: File) {
    const formData = new FormData();
    formData.append('excel_file', file);

    return fetch(`${this.baseUrl}/import_computers.php`, {
      method: 'POST',
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
      },
      body: formData,
    }).then(response => response.json());
  }

  async createComputer(computerData: Omit<Computer, 'id'>) {
    return this.request('/create_computer.php', {
      method: 'POST',
      body: JSON.stringify(computerData),
    });
  }

  async deleteComputers(computerIds: number[]) {
    return this.request('/delete_computers.php', {
      method: 'DELETE',
      body: JSON.stringify({ computer_ids: computerIds }),
    });
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Export types and classes
export { ApiError, type Computer, type User, type ApiResponse };