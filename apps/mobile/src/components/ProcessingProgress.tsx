import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../config/theme';

interface ProcessingProgressProps {
  currentStep: string;
  progress: number;
}

const PIPELINE_STEPS = [
  { label: 'Image uploaded', minProgress: 10 },
  { label: 'Product detected', minProgress: 20 },
  { label: 'Removing background', minProgress: 40 },
  { label: 'Creating studio image', minProgress: 65 },
  { label: 'Generating catalog', minProgress: 80 },
  { label: 'Completed', minProgress: 100 },
];

export default function ProcessingProgress({ currentStep, progress }: ProcessingProgressProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.titleText}>🤖 AI Processing Pipeline ({progress}%)</Text>
        <Text style={styles.stepText}>{currentStep}</Text>
      </View>

      {/* Progress Bar Container */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(5, progress))}%` }]} />
      </View>

      {/* Stepper List */}
      <View style={styles.stepperContainer}>
        {PIPELINE_STEPS.map((step, idx) => {
          const isDone = progress >= step.minProgress;
          const isCurrent = currentStep.toLowerCase().includes(step.label.toLowerCase());

          return (
            <View key={idx} style={styles.stepRow}>
              <Text style={styles.stepIcon}>{isDone ? '✓' : isCurrent ? '⏳' : '○'}</Text>
              <Text
                style={[
                  styles.stepLabel,
                  isDone && styles.stepLabelDone,
                  isCurrent && styles.stepLabelCurrent,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: theme.colors.gray100,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  stepperContainer: {
    gap: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepIcon: {
    fontSize: 14,
    width: 18,
    textAlign: 'center',
  },
  stepLabel: {
    fontSize: 13,
    color: theme.colors.gray400,
    fontWeight: '600',
  },
  stepLabelDone: {
    color: '#10B981',
    fontWeight: '700',
  },
  stepLabelCurrent: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
});
