import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../config/theme';
import { useAuthStore } from '../store/authStore';
import { useProductStore } from '../store/productStore';
import { ProductStatus } from '../types/product';

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
  const { user } = useAuthStore();
  const { products, fetchProducts, isLoading } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  const totalCount = products.length;
  const publishedCount = products.filter((p) => p.status === ProductStatus.Published).length;
  const draftCount = products.filter((p) => p.status === ProductStatus.Draft || p.status === ProductStatus.AIReview).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>வணக்கம்! 👋</Text>
            <Text style={styles.sellerName}>{user?.name || user?.shopName || 'ZAH Seller'}</Text>
            {user?.shopName && <Text style={styles.shopSubtext}>🏪 {user.shopName}</Text>}
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>AI Ready ✨</Text>
          </View>
        </View>

        {/* Hero CTA Banner: Add Product */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroTitle}>புதிய தயாரிப்பு சேர்க்க 🚀</Text>
          <Text style={styles.heroSubtitle}>
            புகைப்படம் எடுங்கள் 📸 → பேசுங்கள் 🎙️ → AI பட்டியலை உருவாக்கும் 🤖
          </Text>

          <TouchableOpacity
            style={styles.heroButton}
            onPress={onStartAddProduct}
            activeOpacity={0.85}
          >
            <Text style={styles.heroButtonIcon}>➕</Text>
            <Text style={styles.heroButtonText}>Add Product / தயாரிப்பு சேர்க்க</Text>
          </TouchableOpacity>
        </View>

        {/* AI Product Studio CTA */}
        <TouchableOpacity
          style={styles.aiStudioBanner}
          onPress={onStartAIStudio}
          activeOpacity={0.85}
        >
          <View style={styles.aiStudioIconWrap}>
            <Text style={styles.aiStudioIcon}>✨</Text>
          </View>
          <View style={styles.aiStudioInfo}>
            <Text style={styles.aiStudioTitle}>AI Product Studio</Text>
            <Text style={styles.aiStudioSubtitle}>
              Turn your photo into a professional studio image
            </Text>
          </View>
          <Text style={styles.aiStudioArrow}>→</Text>
        </TouchableOpacity>

        {/* Today's Overview Stats */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>இன்றைய மேலோட்டம் (Today's Overview)</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{totalCount}</Text>
            <Text style={styles.statLabel}>மொத்த பொருட்கள்</Text>
            <Text style={styles.statSublabel}>Total Products</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.statNumber, { color: theme.colors.success }]}>{publishedCount}</Text>
            <Text style={styles.statLabel}>வெளியிடப்பட்டது</Text>
            <Text style={styles.statSublabel}>Published</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFFBEB' }]}>
            <Text style={[styles.statNumber, { color: '#D97706' }]}>{draftCount}</Text>
            <Text style={styles.statLabel}>வரைவு</Text>
            <Text style={styles.statSublabel}>Drafts</Text>
          </View>
        </View>

        {/* Recent Products */}
        <View style={styles.sectionHeaderBetween}>
          <Text style={styles.sectionTitle}>சமீபத்திய பொருட்கள் (Recent Products)</Text>
          <TouchableOpacity onPress={onViewProducts}>
            <Text style={styles.viewAllText}>அனைத்தும் காண் →</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 24 }} />
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>இன்னும் பொருட்கள் சேர்க்கப்படவில்லை</Text>
            <Text style={styles.emptySubtitle}>
              AI மூலம் உங்கள் முதல் தயாரிப்பை உடனே பதிவேற்றவும்
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={onStartAddProduct}>
              <Text style={styles.emptyButtonText}>+ Add First Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          products.slice(0, 5).map((product) => {
            const isPublished = product.status === ProductStatus.Published;
            const primaryImg = product.images?.[0]?.thumbnailUrl || product.images?.[0]?.originalUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';

            return (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={onViewProducts}
                activeOpacity={0.7}
              >
                <Image source={{ uri: primaryImg }} style={styles.productImage} />

                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name?.value || 'Untitled Product'}
                  </Text>
                  <Text style={styles.productCategory}>
                    {product.categoryName?.value || 'General'}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>
                      ₹{product.pricing?.price?.value || 0}
                    </Text>
                    {product.pricing?.compareAtPrice?.value ? (
                      <Text style={styles.comparePrice}>
                        ₹{product.pricing.compareAtPrice.value}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={[styles.statusBadge, isPublished ? styles.badgePublished : styles.badgeDraft]}>
                  <Text style={[styles.statusBadgeText, isPublished ? styles.textPublished : styles.textDraft]}>
                    {isPublished ? 'Published ✅' : 'Draft 📝'}
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  sellerName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  shopSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  heroBanner: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...theme.shadows.md,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.white,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#E0E7FF',
    marginBottom: 18,
    lineHeight: 18,
  },
  heroButton: {
    backgroundColor: theme.colors.white,
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  heroButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  heroButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiStudioIcon: {
    fontSize: 22,
  },
  aiStudioInfo: {
    flex: 1,
    marginLeft: 12,
  },
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
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  statSublabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: theme.colors.gray100,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  comparePrice: {
    fontSize: 12,
    color: theme.colors.gray400,
    textDecorationLine: 'line-through',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePublished: {
    backgroundColor: '#ECFDF5',
  },
  badgeDraft: {
    backgroundColor: '#FFFBEB',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textPublished: {
    color: theme.colors.success,
  },
  textDraft: {
    color: '#D97706',
  },
  emptyState: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 12,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
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
    fontSize: 14,
  },
});
