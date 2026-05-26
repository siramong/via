import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ScreenShell } from "../components/ScreenShell";
import { ViaAction, ViaState } from "../state/viaState";
import { colors, metrics, radii } from "../theme";

export function ProfileScreen({
  state
}: {
  state: ViaState;
  dispatch: React.Dispatch<ViaAction>;
}) {
  const tier = state.reputation >= 80 ? "Elite" : state.reputation >= 50 ? "Activo" : "Nuevo";

  return (
    <ScreenShell title="Perfil" subtitle="Reputacion dinamica y peso historico de tus aportes.">
      <View style={styles.profile}>
        <Text style={styles.name}>Conductor VIA</Text>
        <Text style={styles.city}>Cuenca, Ecuador</Text>
        <View style={styles.tier}>
          <Text style={styles.tierText}>{tier}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Metric label="Reputacion" value={`${state.reputation}`} />
        <Metric label="Aportes" value={`${state.contributions}`} />
        <Metric label="Validaciones" value={`${state.validations}`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Principio central</Text>
        <Text style={styles.cardCopy}>
          VIA no es solo una app de informacion. Es una red de intercambio: acceso a datos por contribucion
          comunitaria.
        </Text>
      </View>
    </ScreenShell>
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
  profile: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: metrics.lg,
    alignItems: "flex-start",
    gap: 6
  },
  name: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 24
  },
  city: {
    color: colors.muted
  },
  tier: {
    backgroundColor: colors.primaryAccent,
    borderRadius: radii.lg,
    paddingHorizontal: metrics.sm,
    paddingVertical: 6,
    marginTop: 6
  },
  tierText: {
    color: colors.background,
    fontWeight: "800"
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  metric: {
    flex: 1,
    backgroundColor: colors.surface,
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
    fontSize: 18,
    marginTop: 4
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: metrics.lg,
    gap: metrics.sm
  },
  cardTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 18
  },
  cardCopy: {
    color: colors.muted,
    lineHeight: 20
  }
});
