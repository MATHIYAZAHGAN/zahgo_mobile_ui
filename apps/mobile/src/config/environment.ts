  /**
 * Environment Configuration
 * 
 * Centralized configuration for different environments
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type Environment = 'development' | 'staging' | 'production';

interface Config {
  apiUrl: string;
  environment: Environment;
  enableLogging: boolean;
  aiDemoMode: boolean;
  appName: string;
}

const getApiUrl = (): string => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:5000/api/v1`;
    }
    return 'http://localhost:5000/api/v1';
  }

  // Check Expo Go / Metro host IP for physical devices
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1' && ip !== '0.0.0.0') {
      return `http://${ip}:5000/api/v1`;
    }
  }

  // Physical Mobile Device Wi-Fi IP fallback to reach computer backend
  return 'http://10.238.251.96:5000/api/v1';
};

const ENV = {
  development: {
    apiUrl: getApiUrl(),
    environment: 'development' as Environment,
    enableLogging: true,
    aiDemoMode: true, // Enable demo mode for testing without AI APIs
    appName: 'ZAH Seller AI (Dev)',
  },
  staging: {
    apiUrl: 'https://staging-api.zahsellerai.com/api/v1',
    environment: 'staging' as Environment,
    enableLogging: true,
    aiDemoMode: false,
    appName: 'ZAH Seller AI (Staging)',
  },
  production: {
    apiUrl: 'https://api.zahsellerai.com/api/v1',
    environment: 'production' as Environment,
    enableLogging: false,
    aiDemoMode: false,
    appName: 'ZAH Seller AI',
  },
};

const getEnvironment = (): Environment => {
  // Check if explicitly set via extra config
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;
  
  if (releaseChannel === 'production') return 'production';
  if (releaseChannel === 'staging') return 'staging';
  
  // Default to development for Expo Go or local builds
  return __DEV__ ? 'development' : 'production';
};

const currentEnv = getEnvironment();

export const config: Config = ENV[currentEnv];

// Helper functions
export const isProduction = () => config.environment === 'production';
export const isDevelopment = () => config.environment === 'development';
export const isStaging = () => config.environment === 'staging';

export const getApiEndpoint = (path: string) => `${config.apiUrl}${path}`;

// Log current configuration (only in development)
if (isDevelopment() && config.enableLogging) {
  console.log('🔧 Environment Configuration:', {
    environment: config.environment,
    apiUrl: config.apiUrl,
    aiDemoMode: config.aiDemoMode,
  });
}

export default config;
