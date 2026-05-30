import { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { colors, radius } from '../../theme';

type Props = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export const Skeleton = ({ width = '100%', height = 20, borderRadius: customRadius, style }: Props) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width: width as any,
          height,
          borderRadius: customRadius ?? radius.sm,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const SkeletonCard = () => (
  <View style={styles.card}>
    <Skeleton height={14} width="40%" />
    <View style={{ height: 8 }} />
    <Skeleton height={22} width="70%" />
    <View style={{ height: 16 }} />
    <Skeleton height={36} width="50%" />
    <View style={{ height: 12 }} />
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Skeleton height={24} width={80} borderRadius={12} />
      <Skeleton height={24} width={100} borderRadius={12} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
  },
  card: {
    backgroundColor: colors.glass,
    borderRadius: radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
