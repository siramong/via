import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenShell } from "../components/ScreenShell";
import { SegmentedChoice } from "../components/SegmentedChoice";
import { ViaAction, ViaState } from "../state/viaState";
import { colors, metrics, radii } from "../theme";
import { FuelType } from "../types";

const fuelOptions: Array<{ value: FuelType; label: string }> = [
  { value: "regular", label: "Regular" },
  { value: "extra", label: "Extra" },
  { value: "diesel", label: "Diesel" }
];

export function ContributeScreen({
  state,
  dispatch
}: {
  state: ViaState;
  dispatch: React.Dispatch<ViaAction>;
}) {
  const station = state.stations[0];
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fuelType, setFuelType] = useState<FuelType>("regular");
  const [price, setPrice] = useState(2.49);
  const [confidence, setConfidence] = useState(88);
  const [ocrRetries, setOcrRetries] = useState(0);

  const message = useMemo(() => {
    if (step === 1) return "Captura una foto clara del tablero de precios.";
    if (step === 2) return "OCR listo. Corrige rapido sin texto libre.";
    return "Confirma y publica para ganar acceso y reputacion.";
  }, [step]);

  const retryOcr = () => {
    if (ocrRetries >= 2) return;
    setOcrRetries((current) => current + 1);
    setConfidence((current) => Math.min(97, current + 4));
    setPrice((current) => Number((current + 0.01).toFixed(2)));
  };

  const publish = () => {
    dispatch({
      type: "submit-contribution",
      payload: { stationId: station.id, fuelType, price, confidence }
    });
    setStep(1);
    setOcrRetries(0);
    setPrice(2.49);
    setConfidence(88);
  };

  return (
    <ScreenShell title="Contribuir con OCR" subtitle="Flujo rapido: foto, correccion guiada y publicacion.">
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Estado del flujo</Text>
        <Text style={styles.heroCopy}>{message}</Text>
        <View style={styles.progress}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={[styles.progressDot, step >= item && styles.progressDotActive]} />
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Estacion detectada</Text>
        <Text style={styles.stationName}>{station.name}</Text>
        <Text style={styles.muted}>{station.address}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tipo de combustible</Text>
        <SegmentedChoice value={fuelType} options={fuelOptions} onChange={setFuelType} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Correccion visual</Text>
        <StepRow label="Precio" value={`$${price.toFixed(2)}`} onMinus={() => setPrice((v) => Number(Math.max(0, v - 0.01).toFixed(2)))} onPlus={() => setPrice((v) => Number((v + 0.01).toFixed(2)))} />
        <StepRow label="Confianza" value={`${confidence}%`} onMinus={() => setConfidence((v) => Math.max(50, v - 3))} onPlus={() => setConfidence((v) => Math.min(99, v + 3))} />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.secondary} onPress={retryOcr}>
          <Text style={styles.secondaryText}>Retry OCR ({ocrRetries}/2)</Text>
        </Pressable>
        <Pressable style={styles.primary} onPress={() => setStep((current) => Math.min(3, current + 1) as 1 | 2 | 3)}>
          <Text style={styles.primaryText}>Continuar</Text>
        </Pressable>
      </View>

      <Pressable style={styles.publish} onPress={publish}>
        <Text style={styles.publishText}>Confirmar y publicar</Text>
      </Pressable>
    </ScreenShell>
  );
}

function StepRow({
  label,
  value,
  onMinus,
  onPlus
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.stepRow}>
      <View>
        <Text style={styles.stepLabel}>{label}</Text>
        <Text style={styles.stepValue}>{value}</Text>
      </View>
      <View style={styles.controls}>
        <Pressable onPress={onMinus} style={styles.control}>
          <Text style={styles.controlText}>-</Text>
        </Pressable>
        <Pressable onPress={onPlus} style={styles.control}>
          <Text style={styles.controlText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: metrics.lg,
    gap: 8
  },
  heroTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 18
  },
  heroCopy: {
    color: colors.muted
  },
  progress: {
    flexDirection: "row",
    gap: 6,
    marginTop: metrics.xs
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated
  },
  progressDotActive: {
    backgroundColor: colors.primaryAccent
  },
  card: {
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
  stationName: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 18
  },
  muted: {
    color: colors.muted
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: metrics.sm,
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: metrics.sm
  },
  stepLabel: {
    color: colors.muted,
    fontSize: 12
  },
  stepValue: {
    color: colors.text,
    fontWeight: "800",
    marginTop: 3
  },
  controls: {
    flexDirection: "row",
    gap: 8
  },
  control: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryAccent,
    alignItems: "center",
    justifyContent: "center"
  },
  controlText: {
    color: colors.background,
    fontWeight: "900",
    fontSize: 18
  },
  actions: {
    flexDirection: "row",
    gap: 10
  },
  secondary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: metrics.sm,
    alignItems: "center"
  },
  secondaryText: {
    color: colors.text,
    fontWeight: "700"
  },
  primary: {
    flex: 1,
    backgroundColor: colors.primaryAccent,
    borderRadius: radii.lg,
    paddingVertical: metrics.sm,
    alignItems: "center"
  },
  primaryText: {
    color: colors.background,
    fontWeight: "800"
  },
  publish: {
    backgroundColor: colors.success,
    borderRadius: radii.lg,
    paddingVertical: metrics.md,
    alignItems: "center"
  },
  publishText: {
    color: colors.background,
    fontWeight: "900"
  }
});
