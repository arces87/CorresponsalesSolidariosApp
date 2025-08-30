import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationService from './LocationService';
import NetworkService from './NetworkService';


// VDCIS
//const BASE_URL = 'https://186.101.59.140:8095/api/v1.0';
//const imei = '88F33DE43A5D40F4F5C4B86397B96A0B';
//const mac = '9ef8f9b213c8502b';

//PMV
const BASE_URL = 'http://186.46.122.74:9004/api/v1.0';
const imei = 'A7ADE24C28FA418DC3F4396F826E8BA8';
const mac = '8a24f9d9eb936a84';

// APP
//const BASE_URL = 'https://186.101.59.140:8095/api/v1.0';
//const imei = Device.osInternalBuildId || Device.deviceName || '';
//const mac = getGUID(imei);

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
    numeroCliente, 
    secuencialEmpresa, 
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
        const errorMessage = data?.message || data?.mensaje || 'Error desconocido al buscar cuentas';
        throw new Error(errorMessage);
      }

      // Validar que la respuesta tenga el formato esperado
      if (!data || typeof data !== 'object') {
        throw new Error('Formato de respuesta inválido');
      }
      
      // Asegurar que siempre devolvamos un objeto con el array de cuentas
      return {
        cuentaDetallesConsolidado: data.cuentaDetallesConsolidado || [],
        ...data // Incluir cualquier otro dato que venga en la respuesta
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

  static async procesarRetiro({
    secuencialCuenta,
    numeroCuentaCliente,
    tipoCuentaCliente,
    valor,
    nombreCliente,
    identificacionCliente,
    tipoIdentificacionCliente,
    descripcion,
    usuario,
    imei: customImei,
    latitud: customLatitud,
    longitud: customLongitud,
    mac: customMac
  }) {
    const url = `${BASE_URL}/Transaccion/procesarRetiro`;
    try {
      const isConnected = await NetworkService.checkConnection();
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }

      // Obtener ubicación actual
      const location = await LocationService.getLocation();
      
      const body = {
        secuencialCuenta,
        numeroCuentaCliente: numeroCuentaCliente || null,
        tipoCuentaCliente: tipoCuentaCliente || null,
        valor,
        nombreCliente: nombreCliente || null,
        identificacionCliente: identificacionCliente || null,
        tipoIdentificacionCliente,
        descripcion: descripcion || null,
        usuario: usuario || null,
        imei: customImei || imei,
        latitud: customLatitud || location.latitud,
        longitud: customLongitud || location.longitud,
        mac: customMac || mac
      };

      console.log('Solicitando procesamiento de retiro a:', url);
      console.log('Datos enviados:', JSON.stringify(body, null, 2));
      
      const token = await this.getAuthToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `Error al procesar el retiro (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        console.error('Error en la respuesta:', errorMessage);
        throw new Error(errorMessage);
      }
      
      return responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      console.error('Error en procesarRetiro:', error);
      throw error;
    }
  }

  static async procesarDeposito({
    secuencialCuenta,
    numeroCuentaCliente,
    tipoCuentaCliente,
    valor,
    nombreCliente,
    identificacionCliente,
    tipoIdentificacionCliente,
    descripcion,
    usuario,
    imei: customImei,
    latitud: customLatitud,
    longitud: customLongitud,
    mac: customMac
  }) {
    const url = `${BASE_URL}/Transaccion/procesarDeposito`;
    try {
      const isConnected = await NetworkService.checkConnection();
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }

      // Obtener ubicación actual
      const location = await LocationService.getLocation();
      
      const body = {
        secuencialCuenta,
        numeroCuentaCliente: numeroCuentaCliente || null,
        tipoCuentaCliente: tipoCuentaCliente || null,
        valor,
        nombreCliente: nombreCliente || null,
        identificacionCliente: identificacionCliente || null,
        tipoIdentificacionCliente,
        descripcion: descripcion || null,
        usuario: usuario || null,
        imei: customImei || imei,
        latitud: customLatitud || location.latitud,
        longitud: customLongitud || location.longitud,
        mac: customMac || mac
      };

      console.log('Solicitando procesamiento de depósito a:', url);
      console.log('Datos enviados:', JSON.stringify(body, null, 2));
      
      const token = await this.getAuthToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `Error al procesar el depósito (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        console.error('Error en la respuesta:', errorMessage);
        throw new Error(errorMessage);
      }
      
      return responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      console.error('Error en procesarDeposito:', error);
      throw error;
    }
  }

  static async listarTiposTransacciones({
    usuario,
    imei: customImei,
    latitud: customLatitud,
    longitud: customLongitud,
    mac: customMac
  } = {}) {
    const url = `${BASE_URL}/Transaccion/listaTipoTransaccion`;
    try {
      const isConnected = await NetworkService.checkConnection();
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }

      // Obtener ubicación actual si no se proporciona
      const location = await LocationService.getLocation();
      
      const body = {
        usuario: usuario || null,
        imei: customImei || imei,
        latitud: customLatitud !== undefined ? customLatitud : location.latitud,
        longitud: customLongitud !== undefined ? customLongitud : location.longitud,
        mac: customMac || mac
      };

      console.log('Solicitando tipos de transacciones a:', url);
      console.log('Datos enviados:', JSON.stringify(body, null, 2));
      
      const token = await this.getAuthToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `Error al obtener tipos de transacciones (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        console.error('Error en la respuesta:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const result = responseText ? JSON.parse(responseText) : {};
      
      // Asegurarse de que siempre devolvamos un array en tiposTransacciones
      if (result && !result.tiposTransacciones) {
        result.tiposTransacciones = [];
      }
      
      return result;
    } catch (error) {
      console.error('Error en listarTiposTransacciones:', error);
      throw error;
    }
  }

  /**
   * Solicita el saldo de una cuenta
   * @param {Object} params - Parámetros de la solicitud
   * @param {string} [params.usuario] - Nombre de usuario del corresponsal
   * @param {string} [params.imei] - IMEI del dispositivo (opcional)
   * @param {number} [params.latitud] - Latitud de la ubicación (opcional)
   * @param {number} [params.longitud] - Longitud de la ubicación (opcional)
   * @param {string} [params.mac] - Dirección MAC del dispositivo (opcional)
   * @returns {Promise<number>} - Saldo de la cuenta
   */
 
  static async solicitudSaldoCuenta({
    usuario,
    imei: customImei,
    latitud: customLatitud,
    longitud: customLongitud,
    mac: customMac
  } = {}) {
    const url = `${BASE_URL}/Usuario/solicitudSaldoCuenta`;
    try {
      const isConnected = await NetworkService.checkConnection();
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }

      const location = await LocationService.getLocation();
      
      const body = {
        usuario: usuario || null,
        imei: customImei || imei,
        latitud: customLatitud !== undefined ? customLatitud : location.latitud,
        longitud: customLongitud !== undefined ? customLongitud : location.longitud,
        mac: customMac || mac
      };

      console.log('Solicitando saldo de cuenta a:', url);
      console.log('Datos enviados:', JSON.stringify(body, null, 2));
      
      const token = await this.getAuthToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `Error al obtener el saldo de la cuenta (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        console.error('Error en la respuesta:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // La respuesta debe ser un número (el saldo)
      const saldo = responseText ? parseFloat(responseText) : 0;
      
      return saldo;
    } catch (error) {
      console.error('Error en solicitudSaldoCuenta:', error);
      throw error;
    }
  }

  /**
   * Solicita el envío de un código OTP al usuario o corresponsal
   * @param {Object} params - Parámetros de la solicitud
   * @param {string} [params.usuario] - Nombre de usuario (opcional si se proporciona identificación)
   * @param {string} [params.identificacion] - Identificación del usuario (opcional si se proporciona usuario)
   * @param {number} params.secuencialTipoIdentificacion - ID del tipo de identificación
   * @param {boolean} params.paraAgente - Indica si el OTP es para el agente (true) o para el cliente (false)
   * @param {string} [params.imei] - IMEI del dispositivo (opcional)
   * @param {number} [params.latitud] - Latitud de la ubicación (opcional)
   * @param {number} [params.longitud] - Longitud de la ubicación (opcional)
   * @param {string} [params.mac] - Dirección MAC del dispositivo (opcional)
   * @returns {Promise<Object>} - Objeto con el resultado de la solicitud
   *   @property {boolean} otpGenerado - Indica si se generó el OTP correctamente
   *   @property {boolean} notificationEmailError - Indica si hubo error en el envío por correo
   *   @property {string} notificationEmailErrorMensaje - Mensaje de error del correo
   *   @property {boolean} notificationSMSError - Indica si hubo error en el envío por SMS
   *   @property {string} notificationSMSErrorMensaje - Mensaje de error del SMS
   */
  static async solicitarOtp({
    usuario = null,
    identificacion = null,
    secuencialTipoIdentificacion,
    paraAgente  } = {}) {
    const url = `${BASE_URL}/Usuario/solicitudOtp`;
    try {
      const isConnected = await NetworkService.checkConnection();
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }

      if (!usuario && !identificacion) {
        throw new Error('Se requiere usuario o identificación');
      }

      if (secuencialTipoIdentificacion === undefined) {
        throw new Error('El secuencial de tipo de identificación es requerido');
      }

      if (paraAgente === undefined) {
        throw new Error('El parámetro paraAgente es requerido');
      }

      const location = await LocationService.getLocation();
      
      const body = {
        usuario,
        identificacion,
        secuencialTipoIdentificacion,
        paraAgente,
        imei: imei,
        latitud: location.latitud,
        longitud: location.longitud,
        mac: mac
      };

      console.log('Solicitando OTP en:', url);
      console.log('Datos enviados:', JSON.stringify(body, null, 2));
      
      const token = await this.getAuthToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        const errorMessage = responseData?.message || `Error al solicitar el OTP (${response.status})`;
        console.error('Error en la respuesta:', errorMessage);
        throw new Error(errorMessage);
      }
      
      return {
        otpGenerado: responseData.otpGenerado || false,
        notificationEmailError: responseData.notificationEmailError || false,
        notificationEmailErrorMensaje: responseData.notificationEmailErrorMensaje || null,
        notificationSMSError: responseData.notificationSMSError || false,
        notificationSMSErrorMensaje: responseData.notificationSMSErrorMensaje || null
      };
    } catch (error) {
      console.error('Error en solicitarOtp:', error);
      throw error;
    }
  }

  /**
   * Verifica un código OTP para un usuario o corresponsal
   * @param {Object} params - Parámetros de la verificación
   * @param {string} [params.usuario] - Nombre de usuario (opcional si se proporciona identificación)
   * @param {string} [params.identificacion] - Identificación del usuario (opcional si se proporciona usuario)
   * @param {string} params.otp - Código OTP a verificar
   * @param {string} [params.imei] - IMEI del dispositivo (opcional)
   * @param {number} [params.latitud] - Latitud de la ubicación (opcional)
   * @param {number} [params.longitud] - Longitud de la ubicación (opcional)
   * @param {string} [params.mac] - Dirección MAC del dispositivo (opcional)
   * @returns {Promise<Object>} - Resultado de la verificación
   */
  static async verificarOtp({
    usuario = null,
    identificacion = null,
    otp,
    imei: customImei,
    latitud: customLatitud,
    longitud: customLongitud,
    mac: customMac
  } = {}) {
    const url = `${BASE_URL}/Usuario/verificarOtp`;
    try {
      const isConnected = await NetworkService.checkConnection();
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }

      if (!usuario && !identificacion) {
        throw new Error('Se requiere usuario o identificación');
      }

      if (!otp) {
        throw new Error('El código OTP es requerido');
      }

      const location = await LocationService.getLocation();
      
      const body = {
        usuario,
        identificacion,
        otp,
        imei: imei,
        latitud: location.latitud,
        longitud: location.longitud,
        mac: mac
      };

      console.log('Verificando OTP en:', url);
      console.log('Datos enviados:', JSON.stringify(body, null, 2));
      
      const token = await this.getAuthToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `Error al verificar el OTP (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        console.error('Error en la respuesta:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // La API devuelve 200 en caso de éxito sin cuerpo
      return { success: true };
    } catch (error) {
      console.error('Error en verificarOtp:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo cliente en el sistema
   * @param {Object} params - Datos del cliente a crear
   * @param {number} [params.secuencialTipoIdentificacion] - ID del tipo de identificación
   * @param {string} [params.identificacion] - Número de identificación
   * @param {string} [params.nombres] - Nombres del cliente
   * @param {string} [params.apellidoPaterno] - Apellido paterno
   * @param {string} [params.apellidoMaterno] - Apellido materno
   * @param {boolean} [params.esMasculino] - true para masculino, false para femenino
   * @param {string} [params.fechaNacimiento] - Fecha de nacimiento (formato ISO 8601)
   * @param {string} [params.telefonoDomicilio] - Teléfono fijo
   * @param {string} [params.telefonoCelular] - Número de celular
   * @param {string} [params.direccionDomiciliaria] - Dirección de domicilio
   * @param {string} [params.referenciaDomiciliaria] - Referencia de domicilio
   * @param {string} [params.codigoPais] - Código de país (ej: 'EC')
   * @param {string} [params.codigoEstadoCivil] - Código de estado civil
   * @param {string} [params.codigoDactilar] - Código dactilar
   * @param {string} [params.mail] - Correo electrónico
   * @param {string} [params.usuario] - Usuario que crea el registro
   * @returns {Promise<boolean>} - true si el cliente se creó correctamente
   */
  /**
   * Busca los tipos de cuenta disponibles para un cliente
   * @param {Object} params - Parámetros de búsqueda
   * @param {number} params.secuencialCliente - ID del cliente
   * @param {number} params.secuencialEmpresa - ID de la empresa
   * @param {string} [params.codigoProductoVista] - Código del producto (opcional)
   * @param {string} [params.usuario] - Usuario que realiza la consulta
   * @returns {Promise<Array>} - Lista de tipos de cuenta disponibles
   */
  static async buscarTipoCuenta({
    secuencialCliente,
    secuencialEmpresa,
    codigoProductoVista,
    usuario
  } = {}) {
    const url = `${BASE_URL}/Cuenta/buscarTipoCuenta`;
    
    try {
      const isConnected = await NetworkService.checkConnection();
      const token = await this.getAuthToken();
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }

      const location = await LocationService.getLocation();
      const body = {
        secuencialCliente,
        secuencialEmpresa,
        codigoProductoVista,
        usuario,
        imei,
        latitud: location.latitud,
        longitud: location.longitud,
        mac,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the error as JSON, use the default error message
        }
        throw new Error(errorMessage);
      }

      const result = responseText ? JSON.parse(responseText) : {};
      return result.tiposCuenta || [];
    } catch (error) {
      console.error('Error en buscarTipoCuenta:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva cuenta para un cliente
   * @param {Object} params - Parámetros para la creación de la cuenta
   * @param {string} params.codigoTipoCuenta - Código del tipo de cuenta a crear
   * @param {number} params.secuencialCliente - ID del cliente
   * @param {string} [params.usuario] - Usuario que realiza la operación
   * @param {string} [params.imei] - IMEI del dispositivo (opcional)
   * @param {number} [params.latitud] - Latitud de la ubicación (opcional)
   * @param {number} [params.longitud] - Longitud de la ubicación (opcional)
   * @param {string} [params.mac] - Dirección MAC del dispositivo (opcional)
   * @returns {Promise<Object>} - Respuesta con las cuentas creadas
   */
  static async crearCuenta({
    codigoTipoCuenta,
    secuencialCliente,
    usuario  
  } = {}) {
    const url = `${BASE_URL}/Cuenta/crearCuenta`;
    
    try {
      const isConnected = await NetworkService.checkConnection();
      const token = await this.getAuthToken();
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }

      const location = await LocationService.getLocation();
      const body = {
        codigoTipoCuenta,
        secuencialCliente,
        usuario,
        imei,
        latitud: location.latitud,
        longitud: location.longitud,
        mac,
      };

      console.log('body:', body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(body),
      });

      console.log('response:', response);

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Si no podemos parsear el error como JSON, usamos el mensaje de error por defecto
        }
        throw new Error(errorMessage);
      }

      return responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      console.error('Error en crearCuenta:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo cliente en el sistema
   */
  static async crearCliente(params = {}) {
    const url = `${BASE_URL}/Cliente/crearCliente`;
    
    try {
      const isConnected = await NetworkService.checkConnection();
      if (!isConnected) {
        throw new Error('Sin conexión a internet');
      }

      const token = await this.getAuthToken();
      const location = await LocationService.getLocation();
      
      const requestData = {
        secuencialTipoIdentificacion: params.secuencialTipoIdentificacion || null,
        identificacion: params.identificacion || null,
        nombres: params.nombres || null,
        apellidoPaterno: params.apellidoPaterno || null,
        apellidoMaterno: params.apellidoMaterno || null,
        esMasculino: params.esMasculino !== undefined ? params.esMasculino : null,
        fechaNacimiento: params.fechaNacimiento ? new Date(params.fechaNacimiento).toISOString() : null,
        telefonoDomicilio: params.telefonoDomicilio || null,
        telefonoCelular: params.telefonoCelular || null,
        direccionDomiciliaria: params.direccionDomiciliaria || null,
        referenciaDomiciliaria: params.referenciaDomiciliaria || null,
        codigoPais: params.codigoPais || null,
        codigoEstadoCivil: params.codigoEstadoCivil || null,
        codigoDactilar: params.codigoDactilar || null,
        mail: params.mail || null,
        usuario: params.usuario || null,
        imei: imei,
        mac: mac,
        latitud: location.latitud,
        longitud: location.longitud
      };

      console.log('Solicitando creación de cliente:', url);
      console.log('Datos del cliente:', JSON.stringify(requestData, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(requestData),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = 'Error al crear el cliente';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // La API devuelve un booleano como texto plano o JSON
      try {
        return JSON.parse(responseText);
      } catch (e) {
        return responseText === 'true';
      }
    } catch (error) {
      console.error('Error en crearCliente:', error);
      throw error;
    }
  }
}

export default ApiService;
