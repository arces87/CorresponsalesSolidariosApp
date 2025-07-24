import * as Location from 'expo-location';

export default class LocationService {
  static async getLocation() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permiso de localización denegado');
      }
      let location = await Location.getCurrentPositionAsync({});
      return {
        latitud: location.coords.latitude,
        longitud: location.coords.longitude
      };
    } catch (e) {
      return {
        latitud: 0,
        longitud: 0
      };
    }
  }
}
