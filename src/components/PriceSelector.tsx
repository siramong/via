import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '../theme';

type Props = {
  label: string;
  value: number;
  step?: number;
  onChange: (next: number) => void;
};

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

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable style={styles.button} onPress={decrement}>
          <Ionicons name="remove" size={18} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.valueWrap}>
          <Text style={styles.currency}>$</Text>
          <Text style={styles.value}>{value.toFixed(2)}</Text>
        </View>
        <Pressable style={styles.button} onPress={increment}>
          <Ionicons name="add" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'capitalize',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  currency: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  value: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
