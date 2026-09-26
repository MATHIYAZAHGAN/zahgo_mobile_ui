/**
 * API Client Service
 * 
 * Centralized Axios-based HTTP client for backend communication
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { storage } from '../utils/storage';
import config from '../config/environment';
import { STORAGE_KEYS } from '../config/constants';

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details: string[];
  };
}

class APIClient {
  private client: AxiosInstance;
  private refreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // If 401 and not already retrying, attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshing) {
            // Wait for refresh to complete
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.refreshing = true;

          try {
            const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            const response = await this.client.post<ApiResponse<any>>('/auth/refresh', {
              refreshToken,
            });

            if (response.data.success && response.data.data) {
              const { accessToken, refreshToken: newRefreshToken } = response.data.data;

              await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
              await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

              this.refreshSubscribers.forEach((callback) => callback(accessToken));
              this.refreshSubscribers = [];

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - clear tokens and redirect to login
            await this.clearAuth();
            // Trigger logout in your auth store here
            return Promise.reject(refreshError);
          } finally {
            this.refreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async clearAuth() {
    await storage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
    await storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
    await storage.deleteItem(STORAGE_KEYS.USER_DATA);
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    console.log('🔵 API POST request:', {
      url: `${config.apiUrl}${url}`,
      data: data,
    });
    
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data);
      console.log('📥 API POST response:', {
        url: url,
        status: response.status,
        success: response.data.success,
        hasData: !!response.data.data,
        error: response.data.error,
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ API POST error:', {
        url: url,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data;
  }

  // File upload with multipart/form-data
  async uploadFile<T>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  // Get raw axios instance for custom requests
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Error helper
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};
