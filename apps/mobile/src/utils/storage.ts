import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cross-platform Storage Service
 * Uses Expo SecureStore on Native (iOS/Android) and AsyncStorage (localStorage) on Web
 */
export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`[Storage] getItem fallback for key "${key}":`, error);
      return await AsyncStorage.getItem(key);
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.warn(`[Storage] setItem fallback for key "${key}":`, error);
      await AsyncStorage.setItem(key, value);
    }
  },

  deleteItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.warn(`[Storage] deleteItem fallback for key "${key}":`, error);
      await AsyncStorage.removeItem(key);
    }
  },
};
