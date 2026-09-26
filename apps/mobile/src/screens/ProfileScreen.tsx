import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../config/theme';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';

interface ProfileScreenProps {
  onLogout: () => void;
  onBackToHome?: () => void;
}

export default function ProfileScreen({ onLogout, onBackToHome }: ProfileScreenProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const [autoEnhance, setAutoEnhance] = React.useState(true);
  const [autoPublish, setAutoPublish] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);

  const handleLanguageChange = async (lang: 'tamil' | 'english') => {
    const langCode = lang === 'tamil' ? 'ta' : 'en';
    await setLanguage(langCode);
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        {onBackToHome ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBackToHome}>
            <Text style={styles.backBtnText}>← {t('common.home')}</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'Z'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'ZAH Seller'}</Text>
          <Text style={styles.shopName}>🏪 {user?.shopName || 'ZAH Store'}</Text>
          <Text style={styles.emailText}>{user?.email || 'seller@zah.com'}</Text>
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 {t('profile.languagePreference')}</Text>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langChip, language === 'ta' && styles.langChipActive]}
              onPress={() => handleLanguageChange('tamil')}
            >
              <Text style={[styles.langText, language === 'ta' && styles.langTextActive]}>
                {t('profile.tamil')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langChip, language === 'en' && styles.langChipActive]}
              onPress={() => handleLanguageChange('english')}
            >
              <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
                {t('profile.english')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI & Automation Settings */}
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
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelGroup}>
              <Text style={styles.settingTitle}>{t('profile.notifications')}</Text>
              <Text style={styles.settingSub}>{t('profile.notificationsDesc')}</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: theme.colors.gray200, true: theme.colors.primary }}
            />
          </View>
        </View>

        {/* Backend System Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ {t('profile.systemInfo')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>{t('profile.backendApi')}:</Text>
            <Text style={styles.infoValue}>http://localhost:5000</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>{t('profile.database')}:</Text>
            <Text style={styles.infoValue}>MongoDB (ZahSellerAI)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>{t('profile.appVersion')}:</Text>
            <Text style={styles.infoValue}>v1.0.0 (Expo SDK 50)</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutButtonText}>🚪 {t('profile.logoutButton')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.gray100,
    borderRadius: 8,
  },
  backBtnText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  profileCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    ...theme.shadows.sm,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 14,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
  },
  langChipActive: {
    backgroundColor: theme.colors.primary,
  },
  langText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  langTextActive: {
    color: theme.colors.white,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  settingLabelGroup: {
    flex: 1,
    paddingRight: 10,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  settingSub: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoKey: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },
});
