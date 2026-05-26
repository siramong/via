import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

type Props = {
  label: string;
  value: number;
  step?: number;
  onChange: (next: number) => void;
};

export const PriceSelector = ({ label, value, step = 0.01, onChange }: Props) => {
  const increment = () => onChange(Number((value + step).toFixed(2)));
  const decrement = () => onChange(Number(Math.max(0, value - step).toFixed(2)));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable style={styles.button} onPress={decrement}>
          <Ionicons name="remove" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.value}>${value.toFixed(2)}</Text>
        <Pressable style={styles.button} onPress={increment}>
          <Ionicons name="add" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
});
