import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { theme } from '../config/theme';
import { useProductStore } from '../store/productStore';
import { ProductStatus, Product } from '../types/product';

const { width } = Dimensions.get('window');

interface ProductsScreenProps {
  onStartAddProduct: () => void;
  onEditProduct?: (productId: string) => void;
  onBackToHome?: () => void;
}

export default function ProductsScreen({
  onStartAddProduct,
  onEditProduct,
  onBackToHome,
}: ProductsScreenProps) {
  const { t } = useTranslation();
  const { products, fetchProducts, publishProduct, deleteProduct, updateProduct, isLoading } =
    useProductStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const onRefresh = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const handleDeactivate = (product: Product) => {
    Alert.alert(
      t('catalog.deactivate'),
      t('common.confirm') + '?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('catalog.deactivate'),
          style: 'destructive',
          onPress: () =>
            updateProduct(product.id, { ...product, status: ProductStatus.Archived }),
        },
      ]
    );
  };

  const handleDelete = (productId: string) => {
    Alert.alert(
      t('catalog.deleteProduct'),
      t('common.confirm') + '?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('catalog.deleteProduct'),
          style: 'destructive',
          onPress: () => deleteProduct(productId),
        },
      ]
    );
  };

  const handlePublish = async (productId: string) => {
    const success = await publishProduct(productId);
    if (!success) {
      const storeError = useProductStore.getState().error;
      Alert.alert(
        t('common.error'),
        storeError || t('errors.publishFailed')
      );
    }
  };

  const filteredProducts = products.filter((p) => {
    const name = (p.name?.value || '').toLowerCase();
    const cat = (p.categoryName?.value || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || name.includes(q) || cat.includes(q);
    if (!matchesSearch) return false;
    if (filter === 'published') return p.status === ProductStatus.Published;
    if (filter === 'draft') return p.status !== ProductStatus.Published;
    return true;
  });

  const publishedCount = products.filter((p) => p.status === ProductStatus.Published).length;
  const draftCount = products.filter((p) => p.status !== ProductStatus.Published).length;

  const renderItem = ({ item: product }: { item: Product }) => {
    const isPublished = product.status === ProductStatus.Published;
    const primaryImg =
      product.images?.[0]?.thumbnailUrl || product.images?.[0]?.originalUrl || null;

    return (
      <View style={styles.productCard}>
        <View style={styles.productImageContainer}>
          {primaryImg ? (
            <Image
              source={{ uri: primaryImg }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderIcon}>📦</Text>
            </View>
          )}
        </View>

        <View style={styles.cardDetails}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.name?.value || 'Untitled Product'}
          </Text>
          <Text style={styles.categorySub} numberOfLines={1}>
            {product.categoryName?.value || 'General'}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>
              ₹{(product.pricing?.price?.value || 0).toLocaleString('en-IN')}
            </Text>
            <View style={[styles.badge, isPublished ? styles.badgePublished : styles.badgeDraft]}>
              <Text
                style={[styles.badgeText, isPublished ? styles.textPublished : styles.textDraft]}
              >
                {isPublished ? t('catalog.published') : t('catalog.draft')}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            {isPublished ? (
              <>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>{t('catalog.live')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deactivateBtn}
                  onPress={() => handleDeactivate(product)}
                  accessibilityRole="button"
                >
                  <Text style={styles.deactivateBtnText}>{t('catalog.deactivate')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.publishBtn}
                onPress={() => handlePublish(product.id)}
                accessibilityRole="button"
              >
                <Text style={styles.publishBtnText}>{t('catalog.publish')}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.iconActions}>
              {onEditProduct && (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => onEditProduct(product.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t('catalog.editProduct')}
                >
                  <Text style={styles.iconBtnText}>✏️</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.iconBtn, styles.iconBtnDanger]}
                onPress={() => handleDelete(product.id)}
                accessibilityRole="button"
                accessibilityLabel={t('catalog.deleteProduct')}
              >
                <Text style={styles.iconBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBackToHome && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackToHome}
            accessibilityRole="button"
          >
            <Text style={styles.backButtonText}>← {t('common.home')}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{t('catalog.title')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onStartAddProduct}
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>+ {t('common.done')}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('catalog.searchPlaceholder')}
          placeholderTextColor={theme.colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(
          [
            { key: 'all', label: t('catalog.allProducts'), count: products.length },
            { key: 'published', label: t('catalog.published'), count: publishedCount },
            { key: 'draft', label: t('catalog.draft'), count: draftCount },
          ] as const
        ).map(({ key, label, count }) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterChip, filter === key && styles.filterChipActive]}
            onPress={() => setFilter(key)}
            accessibilityRole="button"
          >
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
              {label} ({count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isLoading ? (
              <>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.emptyText}>{t('common.loading')}</Text>
              </>
            ) : searchQuery ? (
              <>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>{t('catalog.emptySearch')}</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>{t('catalog.noProducts')}</Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={onStartAddProduct}
                  accessibilityRole="button"
                >
                  <Text style={styles.emptyAddBtnText}>+ {t('catalog.addFirst')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.min(20, width * 0.05),
    paddingVertical: 12,
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.gray100,
    borderRadius: 8,
  },
  backButtonText: { color: theme.colors.primary, fontWeight: '700', fontSize: 13 },
  title: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary, flex: 1, marginHorizontal: 8 },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: { color: theme.colors.white, fontWeight: '700', fontSize: 13 },
  searchContainer: { paddingHorizontal: Math.min(20, width * 0.05), marginBottom: 10 },
  searchInput: {
    backgroundColor: theme.colors.white,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Math.min(20, width * 0.05),
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.gray100,
  },
  filterChipActive: { backgroundColor: theme.colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: theme.colors.text.secondary },
  filterTextActive: { color: theme.colors.white },
  listContent: {
    paddingHorizontal: Math.min(20, width * 0.05),
    paddingBottom: 48,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    ...theme.shadows.sm,
  },
  productImageContainer: { marginRight: 12 },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: theme.colors.gray100,
  },
  placeholderImage: { justifyContent: 'center', alignItems: 'center' },
  placeholderIcon: { fontSize: 28 },
  cardDetails: { flex: 1 },
  productTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  categorySub: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceText: { fontSize: 15, fontWeight: '800', color: theme.colors.primary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgePublished: { backgroundColor: '#ECFDF5' },
  badgeDraft: { backgroundColor: '#FFFBEB' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  textPublished: { color: theme.colors.success },
  textDraft: { color: '#D97706' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveBadgeText: { color: '#15803D', fontSize: 11, fontWeight: '700' },
  deactivateBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deactivateBtnText: { color: '#D97706', fontSize: 10, fontWeight: '700' },
  publishBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
  },
  publishBtnText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  iconActions: { flexDirection: 'row', gap: 4, marginLeft: 'auto' },
  iconBtn: {
    padding: 6,
    backgroundColor: theme.colors.gray100,
    borderRadius: 6,
  },
  iconBtnDanger: { backgroundColor: '#FEE2E2' },
  iconBtnText: { fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyAddBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyAddBtnText: { color: theme.colors.white, fontWeight: '700', fontSize: 13 },
});
