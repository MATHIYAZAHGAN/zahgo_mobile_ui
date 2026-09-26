import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../config/theme';

interface ProductImageGalleryProps {
  originalUrl: string;
  mainUrl: string;
  lifestyleUrl?: string;
  thumbnailUrl?: string;
  onSetMain: (url: string) => void;
  onRegenerate: (style: string) => void;
}

export default function ProductImageGallery({
  originalUrl,
  mainUrl,
  lifestyleUrl,
  thumbnailUrl,
  onSetMain,
  onRegenerate,
}: ProductImageGalleryProps) {
  const cards = [
    { title: 'Main Catalog Image (Amazon White)', url: mainUrl, tag: 'Main' },
    { title: 'Background Removed Studio', url: mainUrl, tag: 'Studio' },
    { title: 'Lifestyle Ambient Shot', url: lifestyleUrl || mainUrl, tag: 'Lifestyle' },
    { title: 'Product Thumbnail', url: thumbnailUrl || mainUrl, tag: 'Thumbnail' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>📸 AI Studio Generated Image Gallery</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
        {cards.map((card, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.imageBox}>
              <Image source={{ uri: card.url }} style={styles.cardImage} />
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{card.tag}</Text>
              </View>
            </View>

            <Text style={styles.cardTitle} numberOfLines={1}>
              {card.title}
            </Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onSetMain(card.url)}>
                <Text style={styles.actionBtnText}>Use Main</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.regenBtn]} onPress={() => onRegenerate('white-background')}>
                <Text style={[styles.actionBtnText, styles.regenBtnText]}>Regenerate</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  galleryScroll: {
    gap: 12,
  },
  card: {
    width: 200,
    backgroundColor: theme.colors.gray100,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  imageBox: {
    width: '100%',
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  tagBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: theme.colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  regenBtn: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  regenBtnText: {
    color: theme.colors.primary,
  },
});
