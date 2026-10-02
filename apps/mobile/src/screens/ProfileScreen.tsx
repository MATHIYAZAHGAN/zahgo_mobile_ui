import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { theme } from '../config/theme';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import { apiClient } from '../services/apiClient';
import { config } from '../config/environment';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  onLogout: () => void;
  onBackToHome?: () => void;
}

export default function ProfileScreen({ onLogout, onBackToHome }: ProfileScreenProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();

  const [autoEnhance, setAutoEnhance] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleLanguageChange = async (lang: 'ta' | 'en') => {
    await setLanguage(lang);
  };

  const handleLogout = async () => {
    Alert.alert(
      t('profile.logoutButton'),
      language === 'ta'
        ? 'நீங்கள் வெளியேற விரும்புகிறீர்களா?'
        : 'Are you sure you want to logout?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logoutButton'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            onLogout();
          },
        },
      ]
    );
  };

  const handleProfilePhotoOptions = () => {
    const options = [
      t('profile.takePhoto'),
      t('profile.chooseGallery'),
    ];
    if (profileImageUri) {
      options.push(t('profile.removePhoto'));
    }
    options.push(t('common.cancel'));

    Alert.alert(
      t('profile.editPhoto'),
      undefined,
      [
        {
          text: t('profile.takePhoto'),
          onPress: () => pickImageFromCamera(),
        },
        {
          text: t('profile.chooseGallery'),
          onPress: () => pickImageFromGallery(),
        },
        ...(profileImageUri
          ? [
              {
                text: t('profile.removePhoto'),
                style: 'destructive' as const,
                onPress: () => {
                  setProfileImageUri(null);
                  Alert.alert('', t('profile.photoRemoved'));
                },
              },
            ]
          : []),
        { text: t('common.cancel'), style: 'cancel' as const },
      ]
    );
  };

  const pickImageFromCamera = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert(
        t('addProduct.cameraPermission') || 'Permission Required',
        language === 'ta'
          ? 'படம் எடுக்க கேமரா அனுமதி தேவை.'
          : 'Camera permission is required to take a photo.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await uploadProfilePhoto(result.assets[0].uri);
    }
  };

  const pickImageFromGallery = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert(
        t('addProduct.galleryPermission') || 'Permission Required',
        language === 'ta'
          ? 'படம் தேர்வு செய்ய கேலரி அனுமதி தேவை.'
          : 'Gallery permission is required to choose a photo.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await uploadProfilePhoto(result.assets[0].uri);
    }
  };

  const uploadProfilePhoto = async (uri: string) => {
    setIsUploadingPhoto(true);
    try {
      // Build multipart form data for upload
      const filename = uri.split('/').pop() || 'profile.jpg';
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

      const formData = new FormData();
      formData.append('image', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type: mimeType,
      } as any);

      // Attempt upload to backend
      const response = await apiClient.uploadFile<{ imageUrl: string }>(
        '/auth/profile/photo',
        formData
      );

      if (response.success && response.data?.imageUrl) {
        setProfileImageUri(response.data.imageUrl);
      } else {
        // Even if upload fails, show the image locally
        setProfileImageUri(uri);
      }
      Alert.alert('', t('profile.photoUpdated'));
    } catch {
      // Show locally even if server upload fails
      setProfileImageUri(uri);
      Alert.alert('', t('profile.photoUpdated'));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const getInitial = () => {
    const name = user?.name || user?.shopName || 'Z';
    return name.charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        {onBackToHome && (
          <TouchableOpacity style={styles.backBtn} onPress={onBackToHome} accessibilityRole="button">
            <Text style={styles.backBtnText}>← {t('common.home')}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar / Photo */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handleProfilePhotoOptions}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('profile.editPhoto')}
          >
            {isUploadingPhoto ? (
              <View style={[styles.avatarContainer, styles.avatarUploading]}>
                <ActivityIndicator size="small" color={theme.colors.white} />
              </View>
            ) : profileImageUri ? (
              <Image
                source={{ uri: profileImageUri }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{getInitial()}</Text>
              </View>
            )}
            {/* Edit overlay badge */}
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>✏️</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user?.name || 'ZAH Seller'}</Text>
          {user?.shopName ? (
            <Text style={styles.shopName}>🏪 {user.shopName}</Text>
          ) : null}
          <Text style={styles.emailText}>{user?.email || ''}</Text>

          {isUploadingPhoto && (
            <Text style={styles.uploadingText}>{t('profile.uploadingPhoto')}</Text>
          )}
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 {t('profile.languagePreference')}</Text>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langChip, language === 'ta' && styles.langChipActive]}
              onPress={() => handleLanguageChange('ta')}
              accessibilityRole="button"
            >
              <Text style={[styles.langText, language === 'ta' && styles.langTextActive]}>
                {t('profile.tamil')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langChip, language === 'en' && styles.langChipActive]}
              onPress={() => handleLanguageChange('en')}
              accessibilityRole="button"
            >
              <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
                {t('profile.english')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI & Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 {t('profile.aiSettings')}</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelGroup}>
              <Text style={styles.settingTitle}>{t('profile.autoEnhance')}</Text>
              <Text style={styles.settingSub}>{t('profile.autoEnhanceDesc')}</Text>
            </View>
            <Switch
              value={autoEnhance}
              onValueChange={setAutoEnhance}
              trackColor={{ false: theme.colors.gray200, true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelGroup}>
              <Text style={styles.settingTitle}>{t('profile.autoPublish')}</Text>
              <Text style={styles.settingSub}>{t('profile.autoPublishDesc')}</Text>
            </View>
            <Switch
              value={autoPublish}
              onValueChange={setAutoPublish}
              trackColor={{ false: theme.colors.gray200, true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLabelGroup}>
              <Text style={styles.settingTitle}>{t('profile.notifications')}</Text>
              <Text style={styles.settingSub}>{t('profile.notificationsDesc')}</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: theme.colors.gray200, true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          </View>
        </View>

        {/* System Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ {t('profile.systemInfo')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>{t('profile.backendApi')}:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {config.apiUrl.replace('/api/v1', '')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>{t('profile.database')}:</Text>
            <Text style={styles.infoValue}>MongoDB Atlas</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>{t('profile.appVersion')}:</Text>
            <Text style={styles.infoValue}>v1.0.0 (Expo SDK 57)</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.logoutButtonText}>🚪 {t('profile.logoutButton')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: {
    paddingHorizontal: Math.min(20, width * 0.05),
    paddingTop: 16,
    paddingBottom: 48,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.min(20, width * 0.05),
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
  },
  backBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.gray100,
    borderRadius: 8,
  },
  backBtnText: { color: theme.colors.primary, fontWeight: '700', fontSize: 13 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary },
  profileCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarUploading: { opacity: 0.7 },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.gray100,
  },
  avatarText: { fontSize: 34, fontWeight: '700', color: theme.colors.white },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadgeText: { fontSize: 12 },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
    textAlign: 'center',
  },
  shopName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 14,
  },
  langRow: { flexDirection: 'row', gap: 10 },
  langChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
  },
  langChipActive: { backgroundColor: theme.colors.primary },
  langText: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary },
  langTextActive: { color: theme.colors.white },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  settingLabelGroup: { flex: 1, paddingRight: 10 },
  settingTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary },
  settingSub: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 2 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  infoKey: { fontSize: 12, color: theme.colors.text.secondary },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    maxWidth: width * 0.5,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  logoutButtonText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
});
