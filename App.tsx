import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { HomeScreen } from './src/screens/HomeScreen';
import { ContributeScreen } from './src/screens/ContributeScreen';
import { MapScreen } from './src/screens/MapScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { useUserStore } from './src/state/userStore';
import { colors, shadows } from './src/theme';
import { ToastContainer } from './src/components/ui/Toast';
import { registerForPushNotifications, savePushToken, addNotificationResponseReceivedListener } from './src/services/notifications';

const Tab = createBottomTabNavigator();

const TAB_CONFIG: Record<string, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  Home: { focused: 'pricetag', unfocused: 'pricetag-outline' },
  Map: { focused: 'map', unfocused: 'map-outline' },
  Profile: { focused: 'person', unfocused: 'person-outline' },
};

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((r) => r.name !== 'Contribute');

  const handleFabPress = useCallback(() => {
    navigation.navigate('Contribute');
  }, [navigation]);

  return (
    <View
      style={{
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: insets.bottom + 12,
        height: 58,
        borderRadius: 29,
        backgroundColor: colors.card,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 16,
      }}
    >
      {visibleRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === state.routes.indexOf(route);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const cfg = TAB_CONFIG[route.name];

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              height: 58,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={
                isFocused
                  ? {
                      shadowColor: colors.primary,
                      shadowOpacity: 0.6,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 8,
                    }
                  : undefined
              }
            >
              {cfg && (
                <Ionicons
                  name={isFocused ? cfg.focused : cfg.unfocused}
                  size={22}
                  color={isFocused ? colors.primary : colors.textSecondary}
                />
              )}
            </View>
          </Pressable>
        );
      })}

      <Pressable
        onPress={handleFabPress}
        style={{
          position: 'absolute',
          top: -42,
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: colors.primary,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 22,
          shadowColor: colors.primary,
          shadowOpacity: 0.5,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 4 },
          elevation: 12,
        }}
      >
        <Ionicons name="camera" size={16} color={colors.background} />
        <Text style={{ color: colors.background, fontSize: 13, fontWeight: '700' }}>Capturar</Text>
      </Pressable>
    </View>
  );
};

const AppTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Mejor' }} />
    <Tab.Screen name="Contribute" component={ContributeScreen} options={{ title: 'Contribuir' }} />
    <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Mapa' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
  </Tab.Navigator>
);

export default function App() {
  const { session, profile, bootstrap, status } = useUserStore();
  const notifListener = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    const unsubscribe = bootstrap();
    return () => {
      unsubscribe.then((fn) => fn()).catch(() => {});
    };
  }, [bootstrap]);

  // Register push notifications when session + profile are ready
  useEffect(() => {
    if (!session || !profile) return;
    registerForPushNotifications()
      .then((token) => {
        if (token) savePushToken(profile.id, token).catch(() => {});
      })
      .catch(() => {});
  }, [session, profile]);

  // Handle notification tap - navigate to map
  useEffect(() => {
    notifListener.current = addNotificationResponseReceivedListener((response) => {
      // User tapped a push notification — could navigate to specific station
      // For now, no action needed since user is already in the app
    });
    return () => notifListener.current?.remove();
  }, []);

  if (status === 'idle' || status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: '#011360', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#4A7AF8" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        {session ? <AppTabs /> : <AuthScreen />}
      </NavigationContainer>
      <ToastContainer />
    </SafeAreaProvider>
  );
}
