import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, spacing, typography } from '../theme';

type Props = {
  label: string;
  value: number;
  step?: number;
  onChange: (next: number) => void;
};

const presets = [0.10, 0.50, 1.00];

export const PriceSelector = ({ label, value, step = 0.01, onChange }: Props) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 50, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const increment = () => {
    onChange(Number((value + step).toFixed(2)));
    animate();
  };
  const decrement = () => {
    onChange(Number(Math.max(0, value - step).toFixed(2)));
    animate();
  };
  const addPreset = (v: number) => {
    onChange(Number((value + v).toFixed(2)));
    animate();
  };
  const subPreset = (v: number) => {
    onChange(Number(Math.max(0, value - v).toFixed(2)));
    animate();
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable style={styles.button} onPress={decrement}>
          <Ionicons name="remove" size={20} color={colors.background} />
        </Pressable>
        <View style={styles.valueWrap}>
          <Text style={styles.currency}>$</Text>
          <Text style={styles.value}>{value.toFixed(2)}</Text>
        </View>
        <Pressable style={styles.button} onPress={increment}>
          <Ionicons name="add" size={20} color={colors.background} />
        </Pressable>
      </View>
      <View style={styles.presets}>
        {presets.map((p) => (
          <Pressable key={p} style={styles.presetBtn} onPress={() => subPreset(p)}>
            <Text style={styles.presetText}>-{p.toFixed(2)}</Text>
          </Pressable>
        ))}
        <View style={styles.presetSpacer} />
        {presets.map((p) => (
          <Pressable key={`p${p}`} style={styles.presetBtn} onPress={() => addPreset(p)}>
            <Text style={styles.presetText}>+{p.toFixed(2)}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  currency: {
    ...typography.h2,
    color: colors.textSecondary,
  },
  value: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  presets: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.xs,
    alignItems: 'center',
  },
  presetBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  presetSpacer: {
    flex: 1,
  },
});
