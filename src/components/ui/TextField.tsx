import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

type Props = TextInputProps & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  rightAction?: React.ReactNode;
};

export const TextField = ({ label, icon, error, rightAction, style, ...rest }: Props) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.row, focused && styles.rowFocused, !!error && styles.rowError]}>
        {icon && <Ionicons name={icon} size={18} color={error ? colors.danger : colors.textSecondary} />}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {rightAction}
      </View>
      {!!error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={12} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowFocused: {
    borderColor: colors.primary,
  },
  rowError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
});
