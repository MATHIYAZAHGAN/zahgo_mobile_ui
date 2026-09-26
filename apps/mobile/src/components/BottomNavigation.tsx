import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../config/theme';

export type MainTab = 'home' | 'products' | 'profile';

interface BottomNavigationProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onAddProductPress: () => void;
}

export default function BottomNavigation({
  activeTab,
  onSelectTab,
  onAddProductPress,
}: BottomNavigationProps) {
  return (
    <View style={styles.container}>
      {/* Home Tab */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSelectTab('home')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, activeTab === 'home' && styles.activeIcon]}>🏠</Text>
        <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeLabel]}>
          முகப்பு (Home)
        </Text>
      </TouchableOpacity>

      {/* Products Tab */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSelectTab('products')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, activeTab === 'products' && styles.activeIcon]}>📦</Text>
        <Text style={[styles.tabLabel, activeTab === 'products' && styles.activeLabel]}>
          பொருட்கள்
        </Text>
      </TouchableOpacity>

      {/* Center Prominent CTA: Add Product */}
      <TouchableOpacity
        style={styles.addButtonContainer}
        onPress={onAddProductPress}
        activeOpacity={0.85}
      >
        <View style={styles.addButton}>
          <Text style={styles.addIcon}>➕</Text>
          <Text style={styles.addText}>சேர்க்க</Text>
        </View>
      </TouchableOpacity>

      {/* Profile Tab */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSelectTab('profile')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, activeTab === 'profile' && styles.activeIcon]}>👤</Text>
        <Text style={[styles.tabLabel, activeTab === 'profile' && styles.activeLabel]}>
          கணக்கு
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 72,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
    opacity: 0.6,
  },
  activeIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  activeLabel: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  addButtonContainer: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  addIcon: {
    fontSize: 22,
    color: theme.colors.white,
  },
  addText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.white,
    marginTop: -2,
  },
});
