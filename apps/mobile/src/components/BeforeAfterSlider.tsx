import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, PanResponder, TouchableOpacity } from 'react-native';
import { theme } from '../config/theme';

interface BeforeAfterSliderProps {
  originalImageUrl: string;
  aiImageUrl: string;
}

export default function BeforeAfterSlider({ originalImageUrl, aiImageUrl }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 to 100

  const handleTouchMove = (evt: any) => {
    const touchX = evt.nativeEvent.locationX;
    const width = 320; // container approximate width
    const percentage = Math.max(0, Math.min(100, (touchX / width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>🔍 Original vs. AI Amazon Studio Photo</Text>
      
      <View style={styles.sliderFrame} onTouchMove={handleTouchMove}>
        {/* Right side: AI Amazon Studio Image */}
        <Image source={{ uri: aiImageUrl }} style={styles.fullImage} />

        {/* Left side: Original Image overlay clipped by sliderPosition */}
        <View style={[styles.clippedOverlay, { width: `${sliderPosition}%` }]}>
          <Image source={{ uri: originalImageUrl }} style={[styles.fullImage, { width: 320 }]} />
        </View>

        {/* Vertical Divider handle line */}
        <View style={[styles.dividerHandle, { left: `${sliderPosition}%` }]}>
          <View style={styles.handleCircle}>
            <Text style={styles.handleText}>◀ ▶</Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.leftBadge}>
          <Text style={styles.badgeText}>ORIGINAL</Text>
        </View>
        <View style={styles.rightBadge}>
          <Text style={styles.badgeText}>✨ AMAZON STUDIO AI</Text>
        </View>
      </View>

      <Text style={styles.hintText}>Drag horizontal slider to compare background removal precision</Text>
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
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  sliderFrame: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  clippedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  dividerHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -1,
  },
  handleCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  handleText: {
    color: theme.colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  leftBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rightBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  hintText: {
    marginTop: 8,
    fontSize: 11,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
