import * as Location from 'expo-location';

export default class LocationService {
  static async getLocation() {
    try {
      // Solicitar permisos con timeout de 5 segundos
      const permissionPromise = Location.requestForegroundPermissionsAsync();
      const permissionTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout solicitando permisos')), 25000)
      );
      
      let { status } = await Promise.race([permissionPromise, permissionTimeout]);
      
      if (status !== 'granted') {
        console.warn('Permiso de localización denegado, usando coordenadas por defecto');
        return {
          latitud: 0,
          longitud: 0
        };
      }
      
      // Obtener ubicación con timeout de 8 segundos
      // Usar maximumAge para aceptar ubicación cacheada (hasta 1 minuto)
      const locationPromise = Location.getCurrentPositionAsync({
        timeout: 8000,
        maximumAge: 60000,
      });
      const locationTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout obteniendo ubicación')), 8000)
      );
      
      let location = await Promise.race([locationPromise, locationTimeout]);
      
      return {
        latitud: location.coords.latitude,
        longitud: location.coords.longitude
      };
    } catch (e) {
      console.warn('Error obteniendo ubicación:', e.message || e);
      // Retornar coordenadas por defecto en lugar de bloquear
      return {
        latitud: 0,
        longitud: 0
      };
    }
  }
}
