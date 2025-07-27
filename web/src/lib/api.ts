const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface RegisterResponse {
  id: number;
  email: string;
  is_active: boolean;
}

interface VerifyResponse {
  status: string;
  purpose: string;
  created_at: string;
}

class ApiClient {
  private getAuthHeaders(token?: string) {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error en el login');
    }
    return response.json();
  }

  async register(email: string, password: string): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error en el registro');
    }
    return response.json();
  }

  async uploadWatermark(file: File, purpose: string, token: string): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);
    
    const response = await fetch(`${API_BASE}/upload/`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Error al subir el archivo');
    }
    return response.blob();
  }

  async verifyWatermark(file: File, token: string): Promise<VerifyResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/verify/`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error al verificar el archivo');
    }
    return response.json();
  }
}

export const apiClient = new ApiClient();