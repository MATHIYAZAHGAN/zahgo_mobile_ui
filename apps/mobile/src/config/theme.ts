/**
 * ZAH Seller AI Design System
 * 
 * Modern, clean, premium design tokens
 * Large touch targets, clear hierarchy, accessibility-first
 */

export const theme = {
  // Brand Colors
  colors: {
    // Primary - Modern Blue
    primary: '#2563EB',
    primaryLight: '#3B82F6',
    primaryDark: '#1E40AF',
    primarySurface: '#EFF6FF',
    
    // Success - Green
    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',
    successSurface: '#ECFDF5',
    
    // Warning - Amber
    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningDark: '#D97706',
    warningSurface: '#FFFBEB',
    
    // Error - Red
    error: '#EF4444',
    errorLight: '#F87171',
    errorDark: '#DC2626',
    errorSurface: '#FEF2F2',
    
    // Neutral - Gray Scale
    black: '#000000',
    gray900: '#111827',
    gray800: '#1F2937',
    gray700: '#374151',
    gray600: '#4B5563',
    gray500: '#6B7280',
    gray400: '#9CA3AF',
    gray300: '#D1D5DB',
    gray200: '#E5E7EB',
    gray100: '#F3F4F6',
    gray50: '#F9FAFB',
    white: '#FFFFFF',
    
    // Semantic Colors
    background: '#FFFFFF',
    surface: '#F9FAFB',
    border: '#E5E7EB',
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
    },
    
    // Status Colors
    draft: '#6B7280',
    processing: '#3B82F6',
    ready: '#10B981',
    published: '#8B5CF6',
    failed: '#EF4444',
  },
  
  // Typography
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
  },
  
  // Border Radius
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },
  
  // Shadows (Elevation)
  shadows: {
    none: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
  },
  
  // Touch Targets (Accessibility)
  touchTarget: {
    min: 44, // Minimum 44x44 pt for touch targets
    comfortable: 56,
    large: 64,
  },
  
  // Animation
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
    },
    easing: {
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
  
  // Layout
  layout: {
    maxWidth: 768, // Maximum content width
    screenPadding: 16, // Standard screen padding
    cardPadding: 16,
    sectionSpacing: 24,
  },
  
  // Icons
  iconSize: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
  },
} as const;

export type Theme = typeof theme;

// Helper functions
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    draft: theme.colors.draft,
    uploading: theme.colors.processing,
    processing: theme.colors.processing,
    ai_review: theme.colors.warning,
    ready: theme.colors.ready,
    published: theme.colors.published,
    failed: theme.colors.failed,
    archived: theme.colors.gray500,
  };
  
  return statusColors[status.toLowerCase()] || theme.colors.gray500;
};
