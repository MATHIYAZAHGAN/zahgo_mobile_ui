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

interface RegisterScreenProps {
  onNavigateToLogin?: () => void;
  onRegisterSuccess?: () => void;
}

export default function RegisterScreen({ onNavigateToLogin, onRegisterSuccess }: RegisterScreenProps) {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});

  const { register, isLoading, error, clearError } = useAuthStore();

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string | undefined } = {};

    // Business name validation
    if (!businessName) {
      newErrors.businessName = 'வணிகப் பெயர் தேவை (Business name required)';
    } else if (businessName.length < 2) {
      newErrors.businessName = 'குறைந்தபட்சம் 2 எழுத்துக்கள் (Minimum 2 characters)';
    }

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

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'கடவுச்சொல் உறுதிப்படுத்தவும் (Confirm password)';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'கடவுச்சொற்கள் பொருந்தவில்லை (Passwords do not match)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    console.log('🔵 Register button clicked');
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    console.log('✅ Form validation passed');
    clearError();

    const registerData = {
      name: businessName,
      shopName: businessName,
      email,
      phoneNumber: email, // Temporarily use email as phone
      password,
    };
    
    console.log('📤 Sending register request with data:', {
      name: registerData.name,
      email: registerData.email,
      phoneNumber: registerData.phoneNumber,
      // Don't log password
    });

    const success = await register(registerData);

    console.log('📥 Register response success:', success);

    if (success) {
      console.log('✅ Registration successful, navigating...');
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    } else {
      console.log('❌ Registration failed');
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
          <Text style={styles.title}>பதிவு செய்யவும்! 🎉</Text>
          <Text style={styles.subtitle}>Create your account</Text>
          <Text style={styles.description}>
            உங்கள் வணிகத்தை AI உடன் வளர்க்கத் தொடங்குங்கள்
          </Text>
          <Text style={styles.descriptionEng}>Start growing your business with AI</Text>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ {error}</Text>
            </View>
          )}

          {/* Business Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>வணிகப் பெயர் (Business Name)</Text>
            <TextInput
              style={[styles.input, errors.businessName ? styles.inputError : undefined]}
              placeholder="My Shop Name"
              placeholderTextColor={theme.colors.gray400}
              value={businessName}
              onChangeText={(text) => {
                setBusinessName(text);
                if (errors.businessName) {
                  setErrors({ ...errors, businessName: undefined });
                }
              }}
              autoCapitalize="words"
              editable={!isLoading}
            />
            {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}
          </View>

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

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>கடவுச்சொல் உறுதி (Confirm Password)</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword ? styles.inputError : undefined]}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.gray400}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: undefined });
                }
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.registerButtonText}>கணக்கை உருவாக்கவும் (Create Account)</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>ஏற்கனவே கணக்கு உள்ளதா? (Already have an account?) </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.loginLink}>உள்நுழையவும் (Login)</Text>
            </TouchableOpacity>
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
  registerButton: {
    height: theme.touchTarget.comfortable,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...theme.shadows.md,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  loginText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
  },
  loginLink: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
});
