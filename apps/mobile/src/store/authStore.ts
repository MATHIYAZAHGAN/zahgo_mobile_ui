/**
 * Authentication State Store
 * 
 * Zustand store for managing authentication state
 */

import { create } from 'zustand';
import { authService, Seller, LoginRequest, RegisterRequest } from '../services/authService';

interface AuthState {
  // State
  user: Seller | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (request: LoginRequest) => Promise<boolean>;
  register: (request: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Login action
  login: async (request: LoginRequest) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authService.login(request);

      if (response.success && response.data) {
        set({
          user: response.data.seller,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        set({
          error: response.error?.message || 'Login failed',
          isLoading: false,
        });
        return false;
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Login failed. Please try again.',
        isLoading: false,
      });
      return false;
    }
  },

  // Register action
  register: async (request: RegisterRequest) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authService.register(request);

      if (response.success && response.data) {
        set({
          user: response.data.seller,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        set({
          error: response.error?.message || 'Registration failed',
          isLoading: false,
        });
        return false;
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Registration failed. Please try again.',
        isLoading: false,
      });
      return false;
    }
  },

  // Logout action
  logout: async () => {
    set({ isLoading: true });

    try {
      await authService.logout();
    } catch (error) {
      // Ignore errors during logout
      console.log('Logout error:', error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // Load user from storage
  loadUser: async () => {
    set({ isLoading: true });

    try {
      const isAuthenticated = await authService.isAuthenticated();

      if (isAuthenticated) {
        const storedUser = await authService.getStoredUser();
        
        if (storedUser) {
          set({
            user: storedUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // Try to fetch fresh user data
          const response = await authService.getProfile();
          
          if (response.success && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      } else {
        set({
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
