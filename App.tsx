import { useEffect } from 'react';
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

const AppTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 16,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.card,
        borderTopWidth: 0,
        paddingBottom: 8,
        paddingTop: 8,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 16,
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 2,
      },
      tabBarItemStyle: {
        paddingVertical: 2,
      },
      tabBarHideOnKeyboard: true,
      tabBarIcon: ({ color, size, focused }) => (
        <Ionicons name={iconForRoute(route.name, focused)} size={size ?? 22} color={color} />
      ),
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: 'Cheapest',
        tabBarLabel: 'Cheapest',
      }}
    />
    <Tab.Screen
      name="Contribute"
      component={ContributeScreen}
      options={{
        title: 'Contribute',
        tabBarLabel: 'Contribute',
      }}
    />
    <Tab.Screen
      name="Map"
      component={MapScreen}
      options={{
        title: 'Map',
        tabBarLabel: 'Map',
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Profile',
        tabBarLabel: 'Profile',
      }}
    />
  </Tab.Navigator>
);

export default function App() {
  const { session, bootstrap } = useUserStore();

  useEffect(() => {
    const unsubscribe = bootstrap();
    return () => {
      unsubscribe.then((fn) => fn());
    };
  }, [bootstrap]);

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        {session ? <AppTabs /> : <AuthScreen />}
      </NavigationContainer>
      <ToastContainer />
    </>
  );
}
