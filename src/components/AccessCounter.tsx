import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

type Props = {
  remaining: number;
};

export const AccessCounter = ({ remaining }: Props) => {
  const tone = remaining === 0 ? colors.danger : remaining <= 1 ? colors.warning : colors.success;
  return (
    <View style={[styles.container, { borderColor: tone }]}>
      <Text style={styles.label}>Access Remaining</Text>
      <Text style={[styles.value, { color: tone }]}>{remaining}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
});
