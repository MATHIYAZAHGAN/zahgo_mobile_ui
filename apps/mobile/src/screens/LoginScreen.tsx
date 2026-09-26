import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { useAuthStore } from '../store/authStore';

interface LoginScreenProps {
  onNavigateToRegister?: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginScreen({ onNavigateToRegister, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login, isLoading, error, clearError } = useAuthStore();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    // Email validation
    if (!email) {
      newErrors.email = 'மின்னஞ்சல் தேவை (Email required)';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'செல்லுபடியாகாத மின்னஞ்சல் (Invalid email)';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'கடவுச்சொல் தேவை (Password required)';
    } else if (password.length < 6) {
      newErrors.password = 'குறைந்தபட்சம் 6 எழுத்துக்கள் (Minimum 6 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    clearError();

    const success = await login({ emailOrPhone: email, password });

    if (success) {
      // Navigate to home screen
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ZAH</Text>
            <Text style={styles.logoSubtext}>SELLER AI</Text>
          </View>

          {/* Welcome Text */}
          <Text style={styles.title}>வணக்கம்! 👋</Text>
          <Text style={styles.subtitle}>Welcome back</Text>
          <Text style={styles.description}>
            உங்கள் தயாரிப்புகளை நிர்வகிக்க உள்நுழையவும்
          </Text>
          <Text style={styles.descriptionEng}>Login to manage your products</Text>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ {error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>மின்னஞ்சல் (Email)</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : undefined]}
              placeholder="your@email.com"
              placeholderTextColor={theme.colors.gray400}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors({ ...errors, email: undefined });
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>கடவுச்சொல் (Password)</Text>
            <TextInput
              style={[styles.input, errors.password ? styles.inputError : undefined]}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.gray400}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({ ...errors, password: undefined });
                }
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.loginButtonText}>உள்நுழையவும் (Login)</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotButton}>
            <Text style={styles.forgotText}>கடவுச்சொல் மறந்துவிட்டதா? (Forgot password?)</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>புதிய பயனரா? (New user?) </Text>
            <TouchableOpacity onPress={onNavigateToRegister}>
              <Text style={styles.registerLink}>பதிவு செய்யவும் (Register)</Text>
            </TouchableOpacity>
          </View>

          {/* Demo Credentials */}
          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>ℹ️ No Account Yet?</Text>
            <Text style={styles.demoText}>Click "Register" below to create your account first!</Text>
            <Text style={styles.demoText}>Then come back here to login.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.layout.screenPadding * 2,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 4,
  },
  logoSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    letterSpacing: 3,
    marginTop: 4,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  description: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  descriptionEng: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: theme.colors.errorSurface,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  input: {
    height: theme.touchTarget.comfortable,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    marginTop: 4,
  },
  loginButton: {
    height: theme.touchTarget.comfortable,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...theme.shadows.md,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  forgotText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  registerText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
  },
  registerLink: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
  demoContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  demoTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.primaryDark,
    marginBottom: 8,
  },
  demoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontFamily: 'monospace',
  },
});
