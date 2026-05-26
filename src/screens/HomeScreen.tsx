import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenShell } from "../components/ScreenShell";
import { StationCard } from "../components/StationCard";
import { ViaAction, ViaState, selectBestStation } from "../state/viaState";
import { colors, metrics, radii, trustColor } from "../theme";
import { FuelType } from "../types";

export function HomeScreen({
  state,
  dispatch
}: {
  state: ViaState;
  dispatch: React.Dispatch<ViaAction>;
}) {
  const best = useMemo(() => selectBestStation(state.stations, "regular"), [state.stations]);
  const fuelType: FuelType = "regular";
  const trust = trustColor(best.station.trustScore);

  return (
    <ScreenShell
      title="Gasolina mas barata cerca"
      subtitle="Una sola accion principal, acceso claro y confianza visible."
    >
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>Resultado principal</Text>
          <View style={[styles.trustDot, { backgroundColor: trust }]} />
        </View>
        <Text style={styles.heroName}>{best.station.name}</Text>
        <Text style={styles.heroPrice}>${best.fuel.price.toFixed(2)}</Text>
        <Text style={styles.heroMeta}>
          {best.station.distanceKm.toFixed(1)} km · confianza {best.station.trustScore}%
        </Text>
        <Pressable style={styles.cta} onPress={() => dispatch({ type: "consume-access" })}>
          <Text style={styles.ctaText}>Ver mas opciones</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <InfoTile label="Accesos restantes" value={`${state.accessRemaining}`} accent={colors.primaryAccent} />
        <InfoTile label="Reputacion" value={`${state.reputation}/100`} accent={colors.success} />
        <InfoTile label="Contribuciones" value={`${state.contributions}`} accent={colors.warning} />
      </View>

      <Text style={styles.sectionTitle}>Cercanas</Text>
      {state.stations.slice(0, 3).map((station) => (
        <StationCard key={station.id} station={station} fuelType={fuelType} highlighted={station.id === best.station.id} />
      ))}
    </ScreenShell>
  );
}

function InfoTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: metrics.lg,
    gap: 6
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  heroLabel: {
    color: colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  trustDot: {
    width: 12,
    height: 12,
    borderRadius: 999
  },
  heroName: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800"
  },
  heroPrice: {
    color: colors.primaryAccent,
    fontSize: 52,
    fontWeight: "900",
    marginTop: 4
  },
  heroMeta: {
    color: colors.muted,
    fontSize: 14
  },
  cta: {
    marginTop: metrics.sm,
    backgroundColor: colors.primaryAccent,
    alignSelf: "flex-start",
    paddingHorizontal: metrics.lg,
    paddingVertical: metrics.sm,
    borderRadius: radii.lg
  },
  ctaText: {
    color: colors.background,
    fontWeight: "800"
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: metrics.sm
  },
  tileLabel: {
    color: colors.muted,
    fontSize: 11
  },
  tileValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 18,
    marginTop: metrics.sm
  }
});
