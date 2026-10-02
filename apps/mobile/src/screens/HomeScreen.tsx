import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../config/theme';
import { useAuthStore } from '../store/authStore';
import { useProductStore } from '../store/productStore';
import { ProductStatus } from '../types/product';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onStartAddProduct: () => void;
  onStartAIStudio: () => void;
  onViewProducts: () => void;
  onSelectProduct?: (productId: string) => void;
}

export default function HomeScreen({
  onStartAddProduct,
  onStartAIStudio,
  onViewProducts,
}: HomeScreenProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { products, fetchProducts, isLoading } = useProductStore();

  const onRefresh = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const totalCount = products.length;
  const publishedCount = products.filter((p) => p.status === ProductStatus.Published).length;
  const draftCount = products.filter(
    (p) => p.status === ProductStatus.Draft || p.status === ProductStatus.AIReview
  ).length;

  // Sort by most recent first
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>{t('home.greeting')}</Text>
            <Text style={styles.sellerName} numberOfLines={1}>
              {user?.name || user?.shopName || 'ZAH Seller'}
            </Text>
            {user?.shopName && (
              <Text style={styles.shopSubtext} numberOfLines={1}>
                🏪 {user.shopName}
              </Text>
            )}
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{t('home.aiReady')}</Text>
          </View>
        </View>

        {/* Hero CTA Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroTitle}>{t('home.addProductTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('home.addProductSubtitle')}</Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={onStartAddProduct}
            activeOpacity={0.85}
            accessibilityLabel={t('home.addProductButton')}
            accessibilityRole="button"
          >
            <Text style={styles.heroButtonIcon}>➕</Text>
            <Text style={styles.heroButtonText}>{t('home.addProductButton')}</Text>
          </TouchableOpacity>
        </View>

        {/* AI Studio Banner */}
        <TouchableOpacity
          style={styles.aiStudioBanner}
          onPress={onStartAIStudio}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <View style={styles.aiStudioIconWrap}>
            <Text style={styles.aiStudioIcon}>✨</Text>
          </View>
          <View style={styles.aiStudioInfo}>
            <Text style={styles.aiStudioTitle}>{t('home.aiStudioTitle')}</Text>
            <Text style={styles.aiStudioSubtitle} numberOfLines={1}>
              {t('home.aiStudioSubtitle')}
            </Text>
          </View>
          <Text style={styles.aiStudioArrow}>→</Text>
        </TouchableOpacity>

        {/* Stats */}
        <Text style={styles.sectionTitle}>{t('home.overviewTitle')}</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{totalCount}</Text>
            <Text style={styles.statLabel}>{t('home.totalProducts')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.statNumber, { color: theme.colors.success }]}>{publishedCount}</Text>
            <Text style={styles.statLabel}>{t('home.published')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFFBEB' }]}>
            <Text style={[styles.statNumber, { color: '#D97706' }]}>{draftCount}</Text>
            <Text style={styles.statLabel}>{t('home.drafts')}</Text>
          </View>
        </View>

        {/* Recent Products */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('home.recentProducts')}</Text>
          <TouchableOpacity onPress={onViewProducts} accessibilityRole="button">
            <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
          </TouchableOpacity>
        </View>

        {isLoading && products.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>{t('home.emptyTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('home.emptySubtitle')}</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={onStartAddProduct}
              accessibilityRole="button"
            >
              <Text style={styles.emptyButtonText}>{t('home.addFirstProduct')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentProducts.map((product) => {
            const isPublished = product.status === ProductStatus.Published;
            const primaryImg =
              product.images?.[0]?.thumbnailUrl ||
              product.images?.[0]?.originalUrl ||
              null;

            return (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={onViewProducts}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <View style={styles.productImageContainer}>
                  {primaryImg ? (
                    <Image
                      source={{ uri: primaryImg }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.productImage, styles.productImagePlaceholder]}>
                      <Text style={styles.productImagePlaceholderText}>📦</Text>
                    </View>
                  )}
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name?.value || 'Untitled Product'}
                  </Text>
                  <Text style={styles.productCategory} numberOfLines={1}>
                    {product.categoryName?.value || 'General'}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>
                      ₹{(product.pricing?.price?.value || 0).toLocaleString('en-IN')}
                    </Text>
                    {(product.pricing?.compareAtPrice?.value || 0) > 0 && (
                      <Text style={styles.comparePrice}>
                        ₹{(product.pricing.compareAtPrice.value || 0).toLocaleString('en-IN')}
                      </Text>
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isPublished ? styles.badgePublished : styles.badgeDraft,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isPublished ? styles.textPublished : styles.textDraft,
                    ]}
                  >
                    {isPublished ? `${t('catalog.published')} ✅` : `${t('catalog.draft')} 📝`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: {
    paddingHorizontal: Math.min(20, width * 0.05),
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: { flex: 1, marginRight: 12 },
  greetingText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  sellerName: {
    fontSize: Math.min(22, width * 0.055),
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  shopSubtext: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.primary },
  heroBanner: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.md,
  },
  heroTitle: {
    fontSize: Math.min(20, width * 0.05),
    fontWeight: '700',
    color: theme.colors.white,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#E0E7FF',
    marginBottom: 16,
    lineHeight: 18,
  },
  heroButton: {
    backgroundColor: theme.colors.white,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  heroButtonIcon: { fontSize: 16, marginRight: 8 },
  heroButtonText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  aiStudioBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    ...theme.shadows.sm,
  },
  aiStudioIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiStudioIcon: { fontSize: 20 },
  aiStudioInfo: { flex: 1, marginLeft: 12 },
  aiStudioTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  aiStudioSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  aiStudioArrow: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Math.min(24, width * 0.06),
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  productImageContainer: { marginRight: 12 },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: theme.colors.gray100,
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImagePlaceholderText: { fontSize: 24 },
  productInfo: { flex: 1, marginRight: 8 },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  comparePrice: {
    fontSize: 11,
    color: theme.colors.gray400,
    textDecorationLine: 'line-through',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePublished: { backgroundColor: '#ECFDF5' },
  badgeDraft: { backgroundColor: '#FFFBEB' },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  textPublished: { color: theme.colors.success },
  textDraft: { color: '#D97706' },
  emptyState: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 8,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
