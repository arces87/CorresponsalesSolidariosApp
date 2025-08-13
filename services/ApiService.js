import AsyncStorage from '@react-native-async-storage/async-storage';
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
const imei = '88F33DE43A5D40F4F5C4B86397B96A0B';//Device.osInternalBuildId || Device.deviceName || '';
const mac = '9ef8f9b213c8502b';//getGUID(imei);

class ApiService {
  static async obtenerDistribuidos({usuario}) {
    const url = `${BASE_URL}/Distribuidos/obtenerDistribuidos`;
    try {
      const isConnected = await NetworkService.checkConnection();
      const token = await this.getAuthToken();
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }
      
      const location = await LocationService.getLocation();
      const body = {
        usuario,
        imei,
        mac,
        latitud: location.latitud,
        longitud: location.longitud
      };      
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.text();
      

      if (!response.ok) {
        let errorMessage = `Error al obtener catálogos (${response.status})`;
        try {
          const errorData = JSON.parse(responseData);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Si no se puede parsear como JSON, usar el texto plano
          errorMessage = responseData || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      // Si la respuesta es exitosa, intentar parsear como JSON
      try {
        return JSON.parse(responseData);
      } catch (e) {
        console.error('Error al parsear respuesta JSON:', e);
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error en obtenerDistribuidos:', error);
      throw error;
    }
  }

  static async login({ usuario, contrasenia}) {
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
      console.log('respuesta:',response);
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
  static async crearAlerta({ idTipo, descripcion, usuario }) {
    const location = await LocationService.getLocation();
    const now = new Date();
    const fecha = now.toISOString();
    const hora = now.toTimeString().slice(0, 8);
    const body = {
      fecha,
      hora,
      descripcion,
      idTipo,
      usuario,
      imei,
      latitud: location.latitud,
      longitud: location.longitud,
      mac,
    };
    const url = `${BASE_URL}/Alerta/crearAlerta`;
    try {
      const isConnected = await NetworkService.checkConnection();
      if (!isConnected) throw new Error('Sin conexión a internet');
      const token = await this.getAuthToken();
      console.log('Token:', token);
      console.log('URL:', url);
      console.log('Body:', body);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify(body),
      });
      console.log('respuesta:', response);
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text;
      }
      if (!response.ok) {
        const mensaje = typeof data === 'object' ? data?.mensaje : data;
        throw new Error(mensaje || 'Error al registrar alerta');
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async listarAlertas({ cantidadElementos = 5, usuario }) {
    const location = await LocationService.getLocation();
    const body = {
      cantidadElementos,
      usuario,
      imei,
      latitud: location.latitud,
      longitud: location.longitud,
      mac,
    };
    const url = `${BASE_URL}/Alerta/listarAlertas`;
    try {
      const isConnected = await NetworkService.checkConnection();
      if (!isConnected) throw new Error('Sin conexión a internet');
      const token = await this.getAuthToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text;
      }
      if (!response.ok) {
        const mensaje = typeof data === 'object' ? data?.mensaje : data;
        throw new Error(mensaje || 'Error al listar alertas');
      }
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export default ApiService;
