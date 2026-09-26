/**
 * Authentication Service
 * 
 * Handles user authentication operations
 */

import { storage } from '../utils/storage';
import { apiClient, ApiResponse } from './apiClient';
import { STORAGE_KEYS } from '../config/constants';
import { config } from '../config/environment';

export interface RegisterRequest {
  name: string;
  shopName?: string;
  email: string;
  phoneNumber: string;
  password: string;
  preferredLanguage?: string;
}

export interface LoginRequest {
  emailOrPhone: string;
  password: string;
}

export interface Seller {
  id: string;
  name: string;
  shopName?: string;
  email: string;
  phoneNumber: string;
  preferredLanguage: string;
  voiceLanguage: string;
  autoPublish: boolean;
  autoImageEnhancement: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  seller: Seller;
  expiresAt: string;
}

class AuthService {
  /**
   * Register a new seller
   */
  async register(request: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    console.log('🔵 AuthService.register called with:', {
      name: request.name,
      email: request.email,
      phoneNumber: request.phoneNumber,
    });
    
    try {
      const response = await apiClient.post<LoginResponse>('/auth/register', request);
      
      console.log('📥 AuthService.register response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
      });
      
      if (response.success && response.data) {
        await this.saveAuthData(response.data);
        console.log('✅ Auth data saved successfully');
      }
      
      return response;
    } catch (error) {
      if (__DEV__ || config.aiDemoMode) {
        console.warn('⚠️ Network Error reaching backend API, falling back to local dev session for physical mobile device');
        const fallbackData: LoginResponse = {
          accessToken: 'demo-jwt-token-access-2026',
          refreshToken: 'demo-jwt-token-refresh-2026',
          seller: {
            id: '65f1a2b3c4d5e6f7a8b9c0f0',
            name: request.name,
            shopName: request.shopName || 'ZAH Online Store',
            email: request.email,
            phoneNumber: request.phoneNumber || '+91 98765 43210',
            preferredLanguage: request.preferredLanguage || 'ta',
            voiceLanguage: 'ta-IN',
            autoPublish: false,
            autoImageEnhancement: true,
          },
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        };

        await this.saveAuthData(fallbackData);
        return {
          success: true,
          data: fallbackData,
          message: 'Registered successfully (Dev Mode)',
        };
      }
      console.error('❌ AuthService.register error:', error);
      throw error;
    }
  }

  /**
   * Login with email/phone and password
   */
  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', request);
      
      if (response.success && response.data) {
        await this.saveAuthData(response.data);
      }
      
      return response;
    } catch (error: any) {
      if (__DEV__ || config.aiDemoMode) {
        console.warn('⚠️ Network Error reaching backend API, falling back to local dev session for physical mobile device');
        const fallbackData: LoginResponse = {
          accessToken: 'demo-jwt-token-access-2026',
          refreshToken: 'demo-jwt-token-refresh-2026',
          seller: {
            id: '65f1a2b3c4d5e6f7a8b9c0f0',
            name: request.emailOrPhone.split('@')[0] || 'ZAH Seller',
            shopName: 'ZAH Online Store',
            email: request.emailOrPhone.includes('@') ? request.emailOrPhone : 'seller@zah.com',
            phoneNumber: '+91 98765 43210',
            preferredLanguage: 'ta',
            voiceLanguage: 'ta-IN',
            autoPublish: false,
            autoImageEnhancement: true,
          },
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        };

        await this.saveAuthData(fallbackData);
        return {
          success: true,
          data: fallbackData,
          message: 'Logged in successfully (Dev Mode)',
        };
      }
      throw error;
    }
  }

  /**
   * Logout and clear authentication data
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      // Ignore logout errors
      console.log('Logout API call failed, clearing local data anyway');
    } finally {
      await this.clearAuthData();
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<Seller>> {
    return await apiClient.get<Seller>('/auth/me');
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return token !== null;
  }

  /**
   * Get stored user data
   */
  async getStoredUser(): Promise<Seller | null> {
    try {
      const userData = await storage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save authentication data securely
   */
  private async saveAuthData(loginResponse: LoginResponse): Promise<void> {
    await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, loginResponse.accessToken);
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, loginResponse.refreshToken);
    await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(loginResponse.seller));
  }

  /**
   * Clear all authentication data
   */
  private async clearAuthData(): Promise<void> {
    await storage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
    await storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
    await storage.deleteItem(STORAGE_KEYS.USER_DATA);
  }
}

// Export singleton instance
export const authService = new AuthService();
