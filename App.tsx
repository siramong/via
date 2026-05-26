import React, { useMemo, useReducer, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  StatusBar,
  useWindowDimensions
} from "react-native";

import { AccessScreen } from "./src/screens/AccessScreen";
import { ContributeScreen } from "./src/screens/ContributeScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MapScreen } from "./src/screens/MapScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { mockStations, mockUser } from "./src/data/mock";
import { colors, metrics, radii, shadows } from "./src/theme";
import { ViaAction, viaReducer, ViaState } from "./src/state/viaState";
import { TabKey, tabs } from "./src/navigation/tabs";

const initialState: ViaState = {
  accessRemaining: 3,
  degradedAccessHits: 0,
  reputation: mockUser.reputation,
  contributions: mockUser.contributions,
  validations: mockUser.validations,
  stations: mockStations,
  lastSubmissionAt: null
};

export default function App() {
  const [state, dispatch] = useReducer(viaReducer, initialState);
  const [tab, setTab] = useState<TabKey>("home");
  const { width } = useWindowDimensions();

  const content = useMemo(() => {
    const shared = { state, dispatch };
    switch (tab) {
      case "home":
        return <HomeScreen {...shared} />;
      case "map":
        return <MapScreen {...shared} />;
      case "contribute":
        return <ContributeScreen {...shared} />;
      case "access":
        return <AccessScreen {...shared} />;
      case "profile":
        return <ProfileScreen {...shared} />;
      default:
        return <HomeScreen {...shared} />;
    }
  }, [dispatch, state, tab]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.shell}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>VIA</Text>
            <Text style={styles.tagline}>Encuentra gasolina mas barata cerca en segundos</Text>
          </View>
          <View style={styles.accessBadge}>
            <Text style={styles.accessLabel}>Accesos</Text>
            <Text style={styles.accessValue}>{state.accessRemaining}</Text>
          </View>
        </View>

        <View style={[styles.contentWrap, { maxWidth: width > 900 ? 920 : "100%" }]}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {content}
          </ScrollView>
        </View>

        <View style={styles.tabBarWrap}>
          <TabBar activeTab={tab} onChangeTab={setTab} dispatch={dispatch} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function TabBar({
  activeTab,
  onChangeTab,
  dispatch
}: {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  dispatch: React.Dispatch<ViaAction>;
}) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((item) => {
        const active = item.key === activeTab;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChangeTab(item.key)}
            style={[styles.tabItem, active && styles.tabItemActive]}
          >
            <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{item.icon}</Text>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
      <Pressable
        onPress={() => dispatch({ type: "consume-access" })}
        style={styles.consumeButton}
      >
        <Text style={styles.consumeText}>Usar acceso</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  shell: {
    flex: 1,
    paddingHorizontal: metrics.lg,
    paddingTop: metrics.lg,
    paddingBottom: metrics.md
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: metrics.md
  },
  brand: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 2
  },
  tagline: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
    maxWidth: 280
  },
  accessBadge: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: metrics.sm,
    paddingHorizontal: metrics.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    ...shadows.card
  },
  accessLabel: {
    color: colors.muted,
    fontSize: 12
  },
  accessValue: {
    color: colors.primaryAccent,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 2
  },
  contentWrap: {
    flex: 1,
    alignSelf: "center",
    width: "100%"
  },
  content: {
    paddingBottom: 120,
    gap: metrics.md
  },
  tabBarWrap: {
    paddingTop: metrics.sm
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: metrics.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: metrics.xs,
    ...shadows.card
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: metrics.sm,
    borderRadius: radii.lg
  },
  tabItemActive: {
    backgroundColor: colors.surfaceElevated
  },
  tabIcon: {
    color: colors.muted,
    fontSize: 18
  },
  tabIconActive: {
    color: colors.primaryAccent
  },
  tabLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2
  },
  tabLabelActive: {
    color: colors.text,
    fontWeight: "700"
  },
  consumeButton: {
    backgroundColor: colors.primaryAccent,
    paddingHorizontal: metrics.md,
    paddingVertical: metrics.sm,
    borderRadius: radii.lg
  },
  consumeText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 12
  }
});
