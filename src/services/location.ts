import * as Location from 'expo-location';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export const requestLocation = async (): Promise<Coordinates> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission not granted.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Highest,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
};
