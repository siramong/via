export const colors = {
  background: "#0B0F1A",
  surface: "#11182A",
  surfaceElevated: "#18213A",
  primary: "#1E2A78",
  primaryAccent: "#4D69FF",
  success: "#19D36B",
  warning: "#FFC400",
  danger: "#FF4D4D",
  text: "#F5F7FF",
  muted: "#94A0C3",
  border: "rgba(255,255,255,0.08)"
};

export const metrics = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32
};

export const radii = {
  md: 12,
  lg: 18,
  xl: 28
};

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 8
  }
};

export function trustColor(score: number) {
  if (score >= 80) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.danger;
}
