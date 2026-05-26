import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from './src/screens/HomeScreen';
import { ContributeScreen } from './src/screens/ContributeScreen';
import { MapScreen } from './src/screens/MapScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { useUserStore } from './src/state/userStore';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

const AppTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.card,
        borderTopColor: colors.border,
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
    }}
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
      <StatusBar />
      <NavigationContainer>
        {session ? <AppTabs /> : <AuthScreen />}
      </NavigationContainer>
    </>
  );
}
