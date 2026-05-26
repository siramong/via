import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, metrics, radii } from "../theme";

export function SegmentedChoice<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.item, active && styles.itemActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8
  },
  item: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    paddingVertical: metrics.sm,
    alignItems: "center"
  },
  itemActive: {
    backgroundColor: colors.primaryAccent
  },
  text: {
    color: colors.muted,
    fontWeight: "700"
  },
  textActive: {
    color: colors.background
  }
});
