import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://186.101.59.140:8095/api/v1.0';

class ApiService {
  static async login({ usuario, contrasenia, imei = '', mac = '', latitud = 0, longitud = 0 }) {
    const url = `${BASE_URL}/Usuario/login`;
    const body = {
      usuario,
      contrasenia,
      imei,
      mac,
      latitud,
      longitud,
    };
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.mensaje || 'Error en autenticación');
      }
      // Guarda el token en AsyncStorage
      if (data.token) {
        await AsyncStorage.setItem('authToken', data.token);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getAuthToken() {
    return AsyncStorage.getItem('authToken');
  }

  static async solicitudActivacion({ usuario, contrasenia, imei = '', mac = '', latitud = 0, longitud = 0 }) {
    const url = `${BASE_URL}/Usuario/solicitudActivacion`;
    const body = {
      usuario,
      contrasenia,
      imei,
      mac,
      latitud,
      longitud,
    };
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.mensaje || 'Error en solicitud de activación');
      }
      return data;
    } catch (error) {
      throw error;
    }
  }
  // Aquí puedes agregar más métodos para otros endpoints
}

export default ApiService;
