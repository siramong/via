import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

type Props = {
  variant?: BadgeVariant;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
};

const variantConfig: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  danger: { bg: colors.dangerLight, text: colors.danger },
  info: { bg: colors.primaryLight, text: colors.primary },
  neutral: { bg: colors.surface1, text: colors.textSecondary },
};

export const Badge = ({ variant = 'neutral', label, icon, style }: Props) => {
  const cfg = variantConfig[variant];

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, style]}>
      {icon && <Ionicons name={icon} size={12} color={cfg.text} />}
      <Text style={[styles.label, { color: cfg.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  label: {
    ...typography.captionBold,
    textTransform: 'capitalize',
  },
});
