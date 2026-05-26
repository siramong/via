import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, metrics, radii } from "../theme";

export function ScreenShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.shell}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: 8
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14
  },
  body: {
    gap: metrics.md,
    marginTop: metrics.sm
  }
});
