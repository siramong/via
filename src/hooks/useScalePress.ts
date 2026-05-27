import * as Haptics from 'expo-haptics';
import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';

export const useScalePress = (scaleTo = 0.96) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true }).start();
  }, [scale, scaleTo]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  }, [scale]);

  return { scale, onPressIn, onPressOut };
};

export const useHapticsOnly = () => {
  const trigger = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);
  return trigger;
};
