import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GasStation, FuelType } from "../types";
import { colors, metrics, radii, shadows, trustColor } from "../theme";

export function StationCard({
  station,
  fuelType,
  highlighted = false,
  onPress
}: {
  station: GasStation;
  fuelType: FuelType;
  highlighted?: boolean;
  onPress?: () => void;
}) {
  const fuel = station.fuelPrices.find((item) => item.fuelType === fuelType) ?? station.fuelPrices[0];
  const tint = trustColor(station.trustScore);

  return (
    <Pressable onPress={onPress} style={[styles.card, highlighted && styles.highlighted]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{station.name}</Text>
          <Text style={styles.meta}>{station.address}</Text>
        </View>
        <View style={[styles.band, { borderColor: tint }]}>
          <Text style={[styles.bandText, { color: tint }]}>{station.trustBand.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric label="Precio" value={`$${fuel.price.toFixed(2)}`} />
        <Metric label="Distancia" value={`${station.distanceKm.toFixed(1)} km`} />
        <Metric label="Confianza" value={`${station.trustScore}%`} />
      </View>
      <Text style={styles.note}>{station.notes}</Text>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: metrics.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: metrics.sm,
    ...shadows.card
  },
  highlighted: {
    borderColor: colors.primaryAccent
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: metrics.sm,
    alignItems: "flex-start"
  },
  name: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 18
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4
  },
  band: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  bandText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1
  },
  metrics: {
    flexDirection: "row",
    gap: 8
  },
  metric: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: metrics.sm
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11
  },
  metricValue: {
    color: colors.text,
    fontWeight: "800",
    marginTop: 3
  },
  note: {
    color: colors.muted,
    fontSize: 12
  }
});
