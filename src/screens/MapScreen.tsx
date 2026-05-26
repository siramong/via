import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ScreenShell } from "../components/ScreenShell";
import { StationCard } from "../components/StationCard";
import { ViaAction, ViaState } from "../state/viaState";
import { colors, metrics, radii } from "../theme";

export function MapScreen({
  state
}: {
  state: ViaState;
  dispatch: React.Dispatch<ViaAction>;
}) {
  return (
    <ScreenShell title="Mapa OSM" subtitle="Ubicacion exacta con fallback manual cuando haga falta.">
      <View style={styles.mapPane}>
        <Text style={styles.mapTitle}>Vista geografica</Text>
        <Text style={styles.mapCopy}>
          Fondo preparado para OpenStreetMap + PostGIS. En esta base se muestran estaciones cercanas y su orden
          por distancia y precio.
        </Text>
        <View style={styles.mapGrid}>
          <Dot label="Tu ubicacion" tone={colors.primaryAccent} />
          <Dot label="Gasolineras" tone={colors.success} />
          <Dot label="Fallback manual" tone={colors.warning} />
        </View>
      </View>

      {state.stations.map((station) => (
        <StationCard key={station.id} station={station} fuelType="regular" />
      ))}
    </ScreenShell>
  );
}

function Dot({ label, tone }: { label: string; tone: string }) {
  return (
    <View style={styles.dotRow}>
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Text style={styles.dotText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mapPane: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: metrics.lg,
    gap: metrics.sm
  },
  mapTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 18
  },
  mapCopy: {
    color: colors.muted,
    lineHeight: 20
  },
  mapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: metrics.xs
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    paddingHorizontal: metrics.sm,
    paddingVertical: 8
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999
  },
  dotText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12
  }
});
