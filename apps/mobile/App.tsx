import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from './src/config/theme';
import { useAuthStore } from './src/store/authStore';
import { useProductStore } from './src/store/productStore';
import { useLanguageStore } from './src/store/languageStore';
import './src/i18n'; // Initialize i18n

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AddProductFlow from './src/screens/AddProductFlow';
import AIProductStudio from './src/screens/AIProductStudio';

// Components
import BottomNavigation, { MainTab } from './src/components/BottomNavigation';

type FlowScreenMode = 'welcome' | 'login' | 'register' | 'main' | 'add_product' | 'ai_studio';

export default function App() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading, loadUser } = useAuthStore();
  const { loadLanguage, isLoading: langLoading } = useLanguageStore();
  const { startNewProductFlow, startEditProductFlow, fetchProducts } = useProductStore();

  const [screenMode, setScreenMode] = useState<FlowScreenMode>('welcome');
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [editProductId, setEditProductId] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([loadUser(), loadLanguage()]);
    };
    initialize();
  }, []);

  // Sync screen with auth state
  useEffect(() => {
    if (isAuthenticated) {
      setScreenMode('main');
      fetchProducts(); // Load real products on auth
    }
  }, [isAuthenticated]);

  const handleStartAddProduct = () => {
    startNewProductFlow();
    setEditProductId(null);
    setScreenMode('add_product');
  };

  const handleEditProduct = (productId: string) => {
    startEditProductFlow(productId);
    setEditProductId(productId);
    setScreenMode('add_product');
  };

  const handleFinishAddProduct = () => {
    setEditProductId(null);
    setScreenMode('main');
    setActiveTab('products');
    fetchProducts(); // Refresh list after adding
  };

  const handleCancelAddProduct = () => {
    setEditProductId(null);
    setScreenMode('main');
  };

  // Loading splash
  if (authLoading || langLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={styles.centerContainer}>
          <View style={styles.splashLogo}>
            <Text style={styles.splashLogoText}>ZAH</Text>
            <Text style={styles.splashLogoSub}>SELLER AI</Text>
          </View>
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 32 }} />
        </View>
      </SafeAreaProvider>
    );
  }

  // Welcome screen
  if (!isAuthenticated && screenMode === 'welcome') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={styles.container}>
          <View style={styles.welcomeContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>ZAH</Text>
              <Text style={styles.logoSubtext}>SELLER AI</Text>
            </View>

            <Text style={styles.welcomeTitle}>{t('auth.greeting')}</Text>
            <Text style={styles.welcomeSubtitle}>
              {t('auth.registerSubtitle')}
            </Text>

            <View style={styles.welcomeButtons}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => setScreenMode('register')}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>{t('auth.createAccount')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setScreenMode('login')}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>{t('auth.login')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!isAuthenticated && screenMode === 'login') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <LoginScreen
          onNavigateToRegister={() => setScreenMode('register')}
          onLoginSuccess={() => setScreenMode('main')}
        />
      </SafeAreaProvider>
    );
  }

  if (!isAuthenticated && screenMode === 'register') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RegisterScreen
          onNavigateToLogin={() => setScreenMode('login')}
          onRegisterSuccess={() => setScreenMode('main')}
        />
      </SafeAreaProvider>
    );
  }

  if (screenMode === 'add_product') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AddProductFlow
          editProductId={editProductId}
          onCancel={handleCancelAddProduct}
          onFinish={handleFinishAddProduct}
        />
      </SafeAreaProvider>
    );
  }

  if (screenMode === 'ai_studio') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AIProductStudio
          onBackToHome={() => setScreenMode('main')}
          onFinish={() => {
            setScreenMode('main');
            setActiveTab('products');
          }}
        />
      </SafeAreaProvider>
    );
  }

  // Main shell
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.mainShell}>
        <View style={styles.mainContent}>
          {activeTab === 'home' && (
            <HomeScreen
              onStartAddProduct={handleStartAddProduct}
              onStartAIStudio={() => setScreenMode('ai_studio')}
              onViewProducts={() => setActiveTab('products')}
            />
          )}
          {activeTab === 'products' && (
            <ProductsScreen
              onStartAddProduct={handleStartAddProduct}
              onEditProduct={handleEditProduct}
              onBackToHome={() => setActiveTab('home')}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileScreen
              onLogout={() => setScreenMode('welcome')}
              onBackToHome={() => setActiveTab('home')}
            />
          )}
        </View>
        <BottomNavigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onAddProductPress={handleStartAddProduct}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  splashLogo: { alignItems: 'center' },
  splashLogoText: {
    fontSize: 52,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 6,
  },
  splashLogoSub: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 4,
    marginTop: 4,
  },
  welcomeContent: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    alignItems: 'center',
  },
  logoContainer: { marginBottom: 44, alignItems: 'center' },
  logoText: {
    fontSize: 52,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 6,
  },
  logoSubtext: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 4,
    marginTop: 4,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 52,
    paddingHorizontal: 8,
  },
  welcomeButtons: { width: '100%', gap: 14 },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  primaryButtonText: { color: theme.colors.white, fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: { color: theme.colors.primary, fontSize: 16, fontWeight: '700' },
  mainShell: { flex: 1, backgroundColor: theme.colors.background },
  mainContent: { flex: 1 },
});
