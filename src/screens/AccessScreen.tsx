import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ScreenShell } from "../components/ScreenShell";
import { ViaAction, ViaState } from "../state/viaState";
import { colors, metrics, radii } from "../theme";
import { isSupabaseConfigured } from "../lib/supabase";

export function AccessScreen({
  state
}: {
  state: ViaState;
  dispatch: React.Dispatch<ViaAction>;
}) {
  const progress = Math.min(1, state.reputation / 100);

  return (
    <ScreenShell title="Control de acceso" subtitle="3 consultas iniciales, luego acceso degradado progresivo.">
      <View style={styles.card}>
        <Text style={styles.label}>Accesos restantes</Text>
        <Text style={styles.big}>{state.accessRemaining}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(12, progress * 100)}%` }]} />
        </View>
        <Text style={styles.copy}>
          Sin contribucion, el resultado se degrada a una sola opcion. Con contribucion, desbloqueas el ranking
          completo.
        </Text>
      </View>

      <View style={styles.grid}>
        <Stat title="Reputacion" value={`${state.reputation}/100`} />
        <Stat title="Contribuciones" value={`${state.contributions}`} />
        <Stat title="Validaciones" value={`${state.validations}`} />
      </View>

      <View style={styles.backendCard}>
        <Text style={styles.label}>Backend</Text>
        <Text style={styles.status}>{isSupabaseConfigured() ? "Supabase listo" : "Supabase pendiente"}</Text>
        <Text style={styles.backendCopy}>Accesos degradados: {state.degradedAccessHits}</Text>
      </View>
    </ScreenShell>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backendCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: metrics.lg,
    gap: metrics.sm
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  big: {
    color: colors.primaryAccent,
    fontSize: 56,
    fontWeight: "900"
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.success
  },
  copy: {
    color: colors.muted,
    lineHeight: 20
  },
  grid: {
    flexDirection: "row",
    gap: 8
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: metrics.sm
  },
  statTitle: {
    color: colors.muted,
    fontSize: 11
  },
  statValue: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 18,
    marginTop: 4
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: metrics.lg,
    gap: metrics.sm
  },
  status: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  backendCopy: {
    color: colors.muted
  }
});
