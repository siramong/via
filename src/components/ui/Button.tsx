import { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type Props = PressableProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  title: string;
  style?: ViewStyle;
};

const sizeConfig: Record<ButtonSize, { py: number; px: number; iconSize: number; textStyle: typeof typography.captionBold }> = {
  sm: { py: 10, px: spacing.md, iconSize: 16, textStyle: typography.captionBold },
  md: { py: 14, px: spacing.lg, iconSize: 18, textStyle: typography.bodyBold },
  lg: { py: 16, px: spacing.xl, iconSize: 20, textStyle: typography.h4 },
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  title,
  disabled,
  style,
  ...rest
}: Props) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const cfg = sizeConfig[size];
  const isDisabled = disabled || loading;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.background : colors.textPrimary} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={cfg.iconSize} color={textColor()} />}
          <Text style={[cfg.textStyle, { color: textColor() }]}>{title}</Text>
        </>
      )}
    </>
  );

  function textColor() {
    if (variant === 'primary') return colors.background;
    if (variant === 'danger') return colors.danger;
    return colors.textPrimary;
  }

  const animatedStyle = { transform: [{ scale }] };

  if (variant === 'primary') {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={isDisabled}
          {...rest}
        >
          <LinearGradient
            colors={isDisabled ? [colors.textMuted, colors.textMuted] : [colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.base, { paddingVertical: cfg.py, paddingHorizontal: cfg.px, opacity: isDisabled ? 0.5 : 1 }]}
          >
            {content}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  const bgMap: Record<ButtonVariant, string> = {
    secondary: colors.surface1,
    danger: colors.dangerLight,
    ghost: 'transparent',
    primary: 'transparent',
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          {
            backgroundColor: bgMap[variant],
            paddingVertical: cfg.py,
            paddingHorizontal: cfg.px,
            opacity: isDisabled ? 0.4 : 1,
          },
          variant === 'danger' && styles.dangerBorder,
          variant === 'secondary' && styles.secondaryBorder,
        ]}
        {...rest}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  dangerBorder: {
    borderWidth: 1,
    borderColor: colors.danger,
  },
});
