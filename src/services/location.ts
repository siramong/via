import * as Location from 'expo-location';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

type LocationCallback = (coords: Coordinates) => void;

let watchSubscription: Location.LocationSubscription | null = null;

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

const DISTANCE_THRESHOLD = 50;

let lastCoords: Coordinates | null = null;

export const startWatchingLocation = async (
  onLocationUpdate: LocationCallback,
): Promise<void> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return;

  stopWatchingLocation();

  watchSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Highest,
      distanceInterval: DISTANCE_THRESHOLD,
      timeInterval: 15000,
    },
    (position) => {
      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      if (
        !lastCoords ||
        Math.abs(coords.latitude - lastCoords.latitude) > 0.0005 ||
        Math.abs(coords.longitude - lastCoords.longitude) > 0.0005
      ) {
        lastCoords = coords;
        onLocationUpdate(coords);
      }
    },
  );
};

export const stopWatchingLocation = (): void => {
  if (watchSubscription) {
    watchSubscription.remove();
    watchSubscription = null;
  }
  lastCoords = null;
};
