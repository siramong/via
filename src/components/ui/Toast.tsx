import { useEffect, useRef } from 'react';
import { Animated, ColorValue, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useToastStore, type ToastVariant } from '../../state/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const variantConfig: Record<ToastVariant, { colors: readonly [ColorValue, ColorValue]; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { colors: ['#1a3a2a', '#0B1020'] as const, icon: 'checkmark-circle' },
  error: { colors: ['#3a1a1a', '#0B1020'] as const, icon: 'alert-circle' },
  info: { colors: ['#1a2a3a', '#0B1020'] as const, icon: 'information-circle' },
};

const ToastItem = ({ id, message, variant }: { id: string; message: string; variant: ToastVariant }) => {
  const hide = useToastStore((s) => s.hide);
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [translateY, opacity]);

  const cfg = variantConfig[variant];

  const iconColor = variant === 'info' ? colors.primary : variant === 'success' ? colors.success : colors.danger;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateY }], opacity }]}>
      <Pressable onPress={() => hide(id)}>
        <LinearGradient colors={cfg.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.toast}>
          <Ionicons name={cfg.icon} size={18} color={iconColor} />
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export const ToastContainer = () => {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    gap: spacing.sm,
  },
  wrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  message: {
    flex: 1,
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
});
