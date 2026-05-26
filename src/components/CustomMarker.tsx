import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme';

type Props = {
  price?: number;
  selected?: boolean;
};

const formatPrice = (price?: number) => {
  if (price == null) return '?';
  return `$${price.toFixed(2)}`;
};

export const CustomMarker = ({ price, selected }: Props) => (
  <View style={[styles.container, selected && styles.containerSelected]}>
    <View style={[styles.badge, selected && styles.badgeSelected]}>
      <Text style={[styles.price, selected && styles.priceSelected]}>
        {formatPrice(price)}
      </Text>
    </View>
    <View style={[styles.pin, selected && styles.pinSelected]}>
      <Ionicons name="location" size={18} color={selected ? colors.background : colors.primary} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
  },
  containerSelected: {
    transform: [{ scale: 1.15 }],
  },
  badge: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 2,
  },
  badgeSelected: {
    backgroundColor: colors.primary,
  },
  price: {
    ...typography.captionBold,
    color: colors.primary,
    fontSize: 11,
  },
  priceSelected: {
    color: colors.background,
  },
  pin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  pinSelected: {
    backgroundColor: colors.primary,
  },
});
