import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
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
  const { isAuthenticated, isLoading: authLoading, loadUser } = useAuthStore();
  const { loadLanguage, isLoading: langLoading } = useLanguageStore();
  const { startNewProductFlow, startEditProductFlow } = useProductStore();

  const [screenMode, setScreenMode] = useState<FlowScreenMode>('welcome');
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [editProductId, setEditProductId] = useState<string | null>(null);

  useEffect(() => {
    // Load user authentication and language preference
    const initialize = async () => {
      await Promise.all([loadUser(), loadLanguage()]);
    };
    initialize();
  }, []);

  // Sync screenMode with authentication state
  useEffect(() => {
    if (isAuthenticated) {
      setScreenMode('main');
    }
  }, [isAuthenticated]);

  const handleStartAddProduct = () => {
    startNewProductFlow();
    setEditProductId(null); // Clear edit mode
    setScreenMode('add_product');
  };

  const handleEditProduct = (productId: string) => {
    startEditProductFlow(productId); // Load product and go to review step
    setEditProductId(productId);
    setScreenMode('add_product');
  };

  const handleFinishAddProduct = () => {
    setEditProductId(null); // Clear edit mode
    setScreenMode('main');
    setActiveTab('products');
  };

  const handleCancelAddProduct = () => {
    setEditProductId(null); // Clear edit mode
    setScreenMode('main');
  };

  // Loading Splash
  if (authLoading || langLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>ZAH Seller AI தொடங்குகிறது...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Welcome Screen
  if (!isAuthenticated && screenMode === 'welcome') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={styles.container}>
          <View style={styles.welcomeContent}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>ZAH</Text>
              <Text style={styles.logoSubtext}>SELLER AI</Text>
            </View>

            {/* Hero Greeting */}
            <Text style={styles.welcomeTitle}>வணக்கம்! 👋</Text>
            <Text style={styles.welcomeSubtitle}>
              AI மூலம் உங்கள் தயாரிப்புகளை இணையத்தில் விற்கலாம்
            </Text>
            <Text style={styles.welcomeDesc}>
              புகைப்படம் எடுங்கள் 📸, பேசுங்கள் 🎙️, AI நொடிகளில் தயாரிப்பு பட்டியலை உருவாக்கி தரும் 🚀
            </Text>

            {/* Buttons */}
            <View style={styles.welcomeButtonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => setScreenMode('register')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Get Started / புதிய கணக்கு</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setScreenMode('login')}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Login / உள்நுழைக</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  // Login Screen
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

  // Register Screen
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

  // Add Product Guided Flow
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

  // AI Product Studio Page
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

  // Main Application Shell (Home, Products, Profile)
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.mainShell}>
        {/* Render Tab Content */}
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

        {/* Persistent Bottom Navigation */}
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  welcomeContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 52,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 6,
  },
  logoSubtext: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 4,
    marginTop: 4,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeDesc: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
    paddingHorizontal: 12,
  },
  welcomeButtonContainer: {
    width: '100%',
    gap: 14,
  },
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
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  mainShell: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mainContent: {
    flex: 1,
  },
});
