import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from './src/screens/HomeScreen';
import { ContributeScreen } from './src/screens/ContributeScreen';
import { MapScreen } from './src/screens/MapScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { useUserStore } from './src/state/userStore';
import { colors } from './src/theme';
import { ToastContainer } from './src/components/ui/Toast';

const Tab = createBottomTabNavigator();

const iconForRoute = (name: string, focused: boolean) => {
  switch (name) {
    case 'Home':
      return focused ? 'pricetag' : 'pricetag-outline';
    case 'Contribute':
      return focused ? 'camera' : 'camera-outline';
    case 'Map':
      return focused ? 'map' : 'map-outline';
    case 'Profile':
      return focused ? 'person' : 'person-outline';
    default:
      return focused ? 'ellipse' : 'ellipse-outline';
  }
};

const AppTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 28,
          right: 28,
          bottom: insets.bottom + 10,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.card,
          borderTopWidth: 0,
          paddingBottom: 6,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 16,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 1,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, size, focused }) => (
          <View style={focused ? { shadowColor: colors.primary, shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 8 } : undefined}>
            <Ionicons name={iconForRoute(route.name, focused)} size={size ?? 20} color={color} />
          </View>
        ),
      })}
    >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: 'Mejor',
        tabBarLabel: 'Mejor',
      }}
    />
    <Tab.Screen
      name="Contribute"
      component={ContributeScreen}
      options={{
        title: 'Contribuir',
        tabBarLabel: 'Contribuir',
      }}
    />
    <Tab.Screen
      name="Map"
      component={MapScreen}
      options={{
        title: 'Mapa',
        tabBarLabel: 'Mapa',
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Perfil',
        tabBarLabel: 'Perfil',
      }}
    />
  </Tab.Navigator>
  );
};

export default function App() {
  const { session, bootstrap } = useUserStore();

  useEffect(() => {
    const unsubscribe = bootstrap();
    return () => {
      unsubscribe.then((fn) => fn());
    };
  }, [bootstrap]);

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
