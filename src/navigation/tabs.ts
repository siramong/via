export type TabKey = "home" | "map" | "contribute" | "access" | "profile";

export const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "home", label: "Home", icon: "🏠" },
  { key: "map", label: "Mapa", icon: "🗺️" },
  { key: "contribute", label: "OCR", icon: "📷" },
  { key: "access", label: "Acceso", icon: "⚡" },
  { key: "profile", label: "Perfil", icon: "👤" }
];
