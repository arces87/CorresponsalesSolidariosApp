import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import LocationService from './LocationService';
import NetworkService from './NetworkService';

function getGUID(imei) {
  let hash = 0;
  if (!imei) return '';
  for (let i = 0; i < imei.length; i++) {
    hash = ((hash << 5) - hash) + imei.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

const BASE_URL = 'https://186.101.59.140:8095/api/v1.0';

class ApiService {
  static async login({ usuario, contrasenia}) {
    const imei = Device.osInternalBuildId || Device.deviceName || '';
    const mac = getGUID(imei);
    const url = `${BASE_URL}/Usuario/login`;
    try {
      const isConnected = await NetworkService.checkConnection();
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }      
      const location = await LocationService.getLocation();
      const body = {
        usuario,
        contrasenia,
        imei,
        mac,
        latitud: location.latitud,
        longitud: location.longitud,
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text; // Es texto plano, no JSON
      }
      if (!response.ok) {
        const mensaje = typeof data === 'object' ? data?.mensaje : data;
        throw new Error(mensaje || 'Error en autenticación');
      }
      if (data.token) await AsyncStorage.setItem('authToken', data.token);
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getAuthToken() {
    return AsyncStorage.getItem('authToken');
  }

  static async solicitudActivacion({ usuario, contrasenia }) {
    const imei = Device.osInternalBuildId || Device.deviceName || '';
    const mac = getGUID(imei);
    const url = `${BASE_URL}/Usuario/solicitudActivacion`;
    try {
      const isConnected = await NetworkService.checkConnection();
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }
      const location = await LocationService.getLocation();
      const body = {
        usuario,
        contrasenia,
        imei,
        mac,
        latitud: location.latitud,
        longitud: location.longitud,
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text; // Es texto plano, no JSON
      }
      if (!response.ok) {
        const mensaje = typeof data === 'object' ? data?.mensaje : data;
        throw new Error(mensaje || 'Error en solicitud de activación');
      }
      return data;
    } catch (error) {
      throw error;
    }
  }
  // Aquí puedes agregar más métodos para otros endpoints
}

export default ApiService;
