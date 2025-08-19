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
      
      console.log('Solicitando catálogos a:', url);
      console.log('Datos enviados:', JSON.stringify(body, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(body),
      });

      // Primero obtener el texto de la respuesta
      const responseText = await response.text();
      //console.log('Respuesta del servidor (texto):', responseText);
      
      if (!response.ok) {
        let errorMessage = `Error al obtener catálogos (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (e) {
          // Si no se puede parsear como JSON, usar el texto plano
          errorMessage = responseText || errorMessage;
        }
        console.error('Error en la respuesta:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Si la respuesta es exitosa, intentar parsear como JSON
      try {
        const data = responseText ? JSON.parse(responseText) : {};
        //console.log('Datos parseados:', JSON.stringify(data, null, 2));
        
        // Verificar si la respuesta tiene la estructura esperada
        if (!data.tiposIdentificaciones || !data.tiposAlertas || !data.paises || !data.estadoCivil) {
          console.warn('La respuesta no tiene la estructura esperada:', data);
          // Devolver la respuesta de todos modos, ya que puede ser válida pero con estructura diferente
        }
        
        return data;
      } catch (e) {
        //console.error('Error al parsear respuesta JSON:', e);
        //console.error('Texto que no se pudo parsear:', responseText);
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      //console.error('Error en obtenerDistribuidos:', error);
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
      //console.log('respuesta:',response);
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
      //const text = await response.text();
      let data;
      try {
        data = JSON.parse(await response.text());
      } catch (e) {
        data = await response.text(); // Es texto plano, no JSON
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
      //console.log('respuesta:', response);
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
      //const text = await response.text();
      let data;
      try {
        data = JSON.parse(await response.text());
      } catch (e) {
        data = await response.text();
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

  /**
   * Busca un cliente por su identificación
   * @param {Object} params - Parámetros de búsqueda
   * @param {string} params.identificacion - Número de identificación del cliente
   * @param {number} params.secuencialTipoIdentificacion - ID del tipo de identificación
   * @param {string} params.usuario - Nombre de usuario del corresponsal
   * @returns {Promise<Object>} - Datos del cliente encontrado
   */
  static async buscarCliente({ identificacion, secuencialTipoIdentificacion, usuario }) {
    const url = `${BASE_URL}/Cliente/buscarCliente`;
    try {
      const isConnected = await NetworkService.checkConnection();
      const token = await this.getAuthToken();
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }
      
      const location = await LocationService.getLocation();
      const body = {
        identificacion,
        secuencialTipoIdentificacion,
        usuario,
        imei,
        mac,
        latitud: location.latitud,
        longitud: location.longitud
      };

      console.log('Buscando cliente con datos:', body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
        throw new Error(mensaje || 'Error al buscar cliente');
      }
      
      return data;
    } catch (error) {
      console.error('Error en buscarCliente:', error);
      throw error;
    }
  }

  /**
   * Busca las cuentas de un cliente
   * @param {Object} params - Parámetros de búsqueda
   * @param {string} params.identificacion - Número de identificación del cliente
   * @param {number} params.secuencialTipoIdentificacion - ID del tipo de identificación
   * @param {number} params.numeroCliente - Número de cliente (opcional)
   * @param {number} params.secuencialEmpresa - ID de la empresa (opcional)
   * @param {string} params.usuario - Nombre de usuario del corresponsal
   * @returns {Promise<Object>} - Datos de las cuentas del cliente
   */
  static async buscarCuentas({ 
    identificacion, 
    secuencialTipoIdentificacion, 
    numeroCliente = null, 
    secuencialEmpresa = null, 
    usuario 
  }) {
    const url = `${BASE_URL}/Cuenta/buscarCuentas`;
    try {
      const isConnected = await NetworkService.checkConnection();
      const token = await this.getAuthToken();
      
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }
      
      const location = await LocationService.getLocation();
      const body = {
        identificacion: identificacion || null,
        secuencialTipoIdentificacion: secuencialTipoIdentificacion || null,
        numeroCliente: numeroCliente || null,
        secuencialEmpresa: secuencialEmpresa || null,
        usuario: usuario || null,
        imei,
        mac,
        latitud: location.latitud,
        longitud: location.longitud
      };

      // Eliminar propiedades nulas o indefinidas
      Object.keys(body).forEach(key => {
        if (body[key] === null || body[key] === undefined) {
          delete body[key];
        }
      });

      console.log('Buscando cuentas con datos:', body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
        const mensaje = typeof data === 'object' ? data?.mensaje || 'Error al buscar cuentas' : data;
        throw new Error(mensaje);
      }
      
      // Asegurar que siempre devolvamos un objeto con el array de cuentas
      return {
        cuentaDetallesConsolidado: data?.cuentaDetallesConsolidado || []
      };
    } catch (error) {
      console.error('Error en buscarCuentas:', error);
      throw error;
    }
  }

  static async cambiarContrasena({ token, contrasenia }) {
    const url = `${BASE_URL}/Usuario/CambioContrasenia`;
    
    try {
      const isConnected = await NetworkService.checkConnection();
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }
      
      const body = {
        token,
        contrasenia
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al cambiar la contraseña: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en cambiarContrasena:', error);
      throw error;
    }
  }
}

export default ApiService;
