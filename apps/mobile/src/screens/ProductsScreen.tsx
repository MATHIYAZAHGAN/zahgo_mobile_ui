import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { theme } from '../config/theme';
import { useProductStore } from '../store/productStore';
import { ProductStatus } from '../types/product';

interface ProductsScreenProps {
  onStartAddProduct: () => void;
  onEditProduct?: (productId: string) => void;
  onBackToHome?: () => void;
}

export default function ProductsScreen({ onStartAddProduct, onEditProduct, onBackToHome }: ProductsScreenProps) {
  const { products, publishProduct, deleteProduct, updateProduct } = useProductStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const handleDeactivateProduct = (productId: string) => {
    // Find the product and update its status to Archived
    const product = products.find(p => p.id === productId);
    if (product) {
      updateProduct(productId, {
        ...product,
        status: ProductStatus.Archived
      });
    }
  };

  const handleEditProduct = (productId: string) => {
    if (onEditProduct) {
      onEditProduct(productId); // Navigate to edit screen
    } else {
      alert('Edit product feature - Navigate to edit screen with product ID: ' + productId);
    }
  };

  const filteredProducts = products.filter((product) => {
    const name = product.name?.value || '';
    const category = product.categoryName?.value || '';
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'published') return product.status === ProductStatus.Published;
    if (filter === 'draft') return product.status !== ProductStatus.Published;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {onBackToHome ? (
          <TouchableOpacity style={styles.backButton} onPress={onBackToHome}>
            <Text style={styles.backButtonText}>← Home</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.title}>பொருட்கள் பட்டியல் (Catalog)</Text>
        <TouchableOpacity style={styles.addButton} onPress={onStartAddProduct}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="தேடுக (Search products or category...)"
          placeholderTextColor={theme.colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            அனைத்தும் ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'published' && styles.filterChipActive]}
          onPress={() => setFilter('published')}
        >
          <Text style={[styles.filterText, filter === 'published' && styles.filterTextActive]}>
            Published ({products.filter((p) => p.status === ProductStatus.Published).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'draft' && styles.filterChipActive]}
          onPress={() => setFilter('draft')}
        >
          <Text style={[styles.filterText, filter === 'draft' && styles.filterTextActive]}>
            Drafts ({products.filter((p) => p.status !== ProductStatus.Published).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>பொருட்கள் எதுவும் பெறப்படவில்லை</Text>
            <Text style={styles.emptySub}>No products found matching your filter</Text>
          </View>
        ) : (
          filteredProducts.map((product) => {
            const isPublished = product.status === ProductStatus.Published;
            const primaryImg =
              product.images?.[0]?.thumbnailUrl ||
              product.images?.[0]?.originalUrl ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';

            return (
              <View key={product.id} style={styles.productCard}>
                <Image source={{ uri: primaryImg }} style={styles.productImage} />

                <View style={styles.cardDetails}>
                  <View style={styles.titleRow}>
                    <Text style={styles.productTitle} numberOfLines={2}>
                      {product.name?.value || 'Untitled Product'}
                    </Text>
                  </View>

                  <Text style={styles.categorySub}>{product.categoryName?.value || 'General'}</Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>₹{product.pricing?.price?.value || 0}</Text>

                    <View
                      style={[
                        styles.badge,
                        isPublished ? styles.badgePublished : styles.badgeDraft,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isPublished ? styles.textPublished : styles.textDraft,
                        ]}
                      >
                        {isPublished ? 'Published' : 'Draft'}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionRow}>
                    {!isPublished ? (
                      <TouchableOpacity
                        style={styles.publishBtn}
                        onPress={async () => {
                          const success = await publishProduct(product.id);
                          if (!success) {
                            const errorStore = useProductStore.getState();
                            Alert.alert(
                              'Publish Failed',
                              errorStore.error || 'Failed to publish product. Please check your connection and try again.',
                              [{ text: 'OK' }]
                            );
                          }
                        }}
                      >
                        <Text style={styles.publishBtnText}>🚀 Publish</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.publishedRow}>
                        <View style={styles.onlineBadge}>
                          <Text style={styles.onlineBadgeText}>🟢 Live</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deactivateBtn}
                          onPress={() => handleDeactivateProduct(product.id)}
                        >
                          <Text style={styles.deactivateBtnText}>⏸️ Deactivate</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <View style={styles.moreActions}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => handleEditProduct(product.id)}
                      >
                        <Text style={styles.editBtnText}>✏️</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => deleteProduct(product.id)}
                      >
                        <Text style={styles.deleteBtnText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.gray100,
    borderRadius: 8,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: theme.colors.white,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.gray100,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    ...theme.shadows.sm,
  },
  productImage: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: theme.colors.gray100,
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 14,
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
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePublished: {
    backgroundColor: '#ECFDF5',
  },
  badgeDraft: {
    backgroundColor: '#FFFBEB',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textPublished: {
    color: theme.colors.success,
  },
  textDraft: {
    color: '#D97706',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
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
  publishedRow: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  onlineBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  onlineBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  deactivateBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deactivateBtnText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '700',
  },
  moreActions: {
    flexDirection: 'row',
    gap: 4,
  },
  editBtn: {
    padding: 6,
    backgroundColor: theme.colors.gray100,
    borderRadius: 6,
  },
  editBtnText: {
    fontSize: 16,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  emptySub: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
});
