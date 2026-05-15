import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importación condicional de la librería Bluetooth térmica
let ThermalPrinter = null;
let errorCarga = null;

try {
  const thermalModule = require('@finan-me/react-native-thermal-printer');
  ThermalPrinter = thermalModule.ThermalPrinter;
  console.log('✓ ThermalPrinter cargado correctamente');
} catch (error) {
  console.error('Error al cargar @finan-me/react-native-thermal-printer:', error);
  errorCarga = error.message || String(error);
  ThermalPrinter = null;
}

/**
 * Servicio para manejar la impresión de comprobantes a través de impresoras Bluetooth (ESC/POS).
 *
 * Parámetros de la impresora soportada:
 * - Método: Línea térmica | Ancho impresión: 48mm | Papel: 57.5±0.5mm
 * - Resolución: 384 línea (8mm, 203dpi) | Velocidad: 90mm/s
 * - Interfaz: USB, Serial, Bluetooth | Interlineado: 3.75mm (ajustable por comando)
 * - Fuente A: 32 caracteres/línea | Fuente B: 42 caracteres/línea | Comandos: ESC/POS
 *
 * NOTA: Requiere la librería @finan-me/react-native-thermal-printer y un build nativo (no Expo Go).
 */
class PrintService {
  /**
   * Configuración según especificaciones de la impresora térmica:
   * - Método: Línea térmica | Ancho impresión: 48mm | Papel: 57.5±0.5mm
   * - Resolución: 384 línea (8mm, 203dpi) | Velocidad: 90mm/s
   * - Fuente A: 32 caracteres/línea | Fuente B: 42 caracteres/línea | Tradicional: 16 caracteres/línea
   * - Interlineado: 3.75mm (ajustable por comando ESC 3) | Comandos: ESC/POS
   */
  static PRINTER_CONFIG = {
    width: 32,       // Fuente A: 32 caracteres por línea (estándar para comprobantes)
    widthFontB: 42,  // Fuente B: 42 caracteres por línea (opcional)
    encoding: 'UTF-8',
    speed: 90,        // mm/s
    paperWidthMm: 48,
    resolutionDpi: 203,
    lineSpacingMm: 3.75, // Interlineado en mm (se envía por comando ESC 3)
  };

  /** Datos estáticos del comprobante (institución, RUC, atención al socio) */
  static COMPROBANTE_DATOS_ESTATICOS = {
    nombreEmpresa: 'COOPAC LOS ANDES DE COTARUSI',
    ruc: '20526918429',    
    atencionAlSocio: '+51945347147',
  };

  /** Clave para persistir la selección de la impresora */
  static STORAGE_KEY_LAST_PRINTER = '@last_printer_address';

  /**
   * Guarda la dirección de la última impresora seleccionada.
   * @param {string} address MAC address (con o sin prefijo)
   */
  static async guardarUltimaImpresora(address) {
    try {
      if (address) {
        await AsyncStorage.setItem(this.STORAGE_KEY_LAST_PRINTER, address);
      }
    } catch (error) {
      console.warn('Error al guardar última impresora:', error);
    }
  }

  /**
   * Recupera la dirección de la última impresora guardada.
   * @returns {Promise<string|null>}
   */
  static async obtenerUltimaImpresora() {
    try {
      return await AsyncStorage.getItem(this.STORAGE_KEY_LAST_PRINTER);
    } catch (error) {
      return null;
    }
  }

  /**
   * Solicita los permisos de Bluetooth necesarios
   * @returns {Promise<boolean>} true si los permisos fueron concedidos
   * @throws {Error} Si los permisos fueron denegados
   */
  static async solicitarPermisosBluetooth() {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const androidVersion = Platform.Version;
      
      if (androidVersion >= 31) {
        const permisos = [
          'android.permission.BLUETOOTH_CONNECT',
          'android.permission.BLUETOOTH_SCAN',
        ];

        try {
          const resultados = await PermissionsAndroid.requestMultiple(permisos);
          const todosConcedidos = permisos.every(
            permiso => resultados[permiso] === PermissionsAndroid.RESULTS.GRANTED
          );

          if (!todosConcedidos) {
            const permisosDenegados = permisos.filter(
              permiso => resultados[permiso] !== PermissionsAndroid.RESULTS.GRANTED
            );
            throw new Error(
              'Se requieren permisos de Bluetooth para usar la impresión.\n\n' +
              `Permisos denegados: ${permisosDenegados.join(', ')}\n\n` +
              'Por favor:\n' +
              '1. Vaya a Configuración > Aplicaciones > [Su App]\n' +
              '2. Seleccione "Permisos"\n' +
              '3. Conceda los permisos de Bluetooth (Conectar y Escanear)\n' +
              '4. Vuelva a intentar'
            );
          }
          return true;
        } catch (error) {
          if (error.message && error.message.includes('Se requieren permisos')) {
            throw error;
          }
          console.warn('Advertencia al solicitar permisos:', error);
          return true;
        }
      } else {
        const permisos = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ];

        const resultados = await PermissionsAndroid.requestMultiple(permisos);
        const todosConcedidos = permisos.every(
          permiso => resultados[permiso] === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!todosConcedidos) {
          throw new Error(
            'Se requiere permiso de ubicación para escanear dispositivos Bluetooth.\n\n' +
            'Por favor, conceda el permiso de ubicación en la configuración de la aplicación.'
          );
        }
        return true;
      }
    } catch (error) {
      console.error('Error al solicitar permisos de Bluetooth:', error);
      if (error.message) throw error;
      throw new Error(
        'No se pudieron solicitar los permisos de Bluetooth.\n\n' +
        'Por favor, conceda los permisos manualmente en Configuración > Aplicaciones.'
      );
    }
  }

  /**
   * Verifica si Bluetooth está disponible y la librería cargada
   * @returns {Promise<boolean>} true si todo está listo
   * @throws {Error} Si hay un problema
   */
  static async verificarBluetooth() {
    if (Platform.OS !== 'android') {
      throw new Error('La impresión Bluetooth solo está disponible en Android');
    }

    if (!ThermalPrinter) {
      let msg = 'La librería de impresión Bluetooth no está disponible.\n\n';
      if (errorCarga) msg += `Error al cargar: ${errorCarga}\n\n`;
      msg += 'Posibles causas:\n';
      msg += '1. La librería no está instalada correctamente\n';
      msg += '2. El código nativo no está compilado (requiere rebuild)\n';
      msg += '3. Está usando Expo Go (no compatible con módulos nativos)\n\n';
      msg += 'Solución: Reconstruya con npx expo run:android';
      throw new Error(msg);
    }

    await this.solicitarPermisosBluetooth();
    return true;
  }

  /**
   * Busca dispositivos Bluetooth emparejados y cercanos.
   * La librería emite los resultados vía eventos, por lo que este método
   * se suscribe a ellos para recolectar la lista.
   * @returns {Promise<Array>} Lista de dispositivos Bluetooth
   */
  static async buscarDispositivosBluetooth() {
    try {
      console.log('Buscando dispositivos Bluetooth...');
      
      if (Platform.OS !== 'android') {
        throw new Error('La impresión Bluetooth solo está disponible en Android');
      }

      if (!ThermalPrinter) {
        throw new Error('La librería de impresión Bluetooth no está disponible.');
      }

      return new Promise(async (resolve, reject) => {
        let paired = [];
        let found = [];
        let resolved = false;

        // Suscribirse a eventos de descubrimiento
        // Nota: La librería devuelve strings JSON que deben ser parseados
        const subPaired = ThermalPrinter.addDiscoveryEventListener(
          'EVENT_DEVICE_ALREADY_PAIRED',
          (data) => {
            console.log('Evento: Dispositivos emparejados recibidos');
            try {
              if (data?.devices) {
                const list = typeof data.devices === 'string' ? JSON.parse(data.devices) : data.devices;
                paired = Array.isArray(list) ? list : [];
              }
            } catch (e) {
              console.warn('Error al parsear dispositivos emparejados:', e);
            }
          }
        );

        const subFound = ThermalPrinter.addDiscoveryEventListener(
          'EVENT_DEVICE_FOUND',
          (data) => {
            try {
              if (data?.device) {
                const device = typeof data.device === 'string' ? JSON.parse(data.device) : data.device;
                if (device && !found.some(d => d.address === device.address)) {
                  found.push(device);
                }
              }
            } catch (e) {
              console.warn('Error al parsear dispositivo encontrado:', e);
            }
          }
        );

        const subDone = ThermalPrinter.addDiscoveryEventListener(
          'EVENT_DEVICE_DISCOVER_DONE',
          (data) => {
            console.log('Evento: Búsqueda finalizada');
            try {
              if (data?.paired) {
                const list = typeof data.paired === 'string' ? JSON.parse(data.paired) : data.paired;
                if (Array.isArray(list)) paired = list;
              }
              if (data?.found) {
                const list = typeof data.found === 'string' ? JSON.parse(data.found) : data.found;
                if (Array.isArray(list)) found = list;
              }
            } catch (e) {
              console.warn('Error al parsear resultado final:', e);
            }
            
            finalizar();
          }
        );

        const finalizar = () => {
          if (resolved) return;
          resolved = true;
          
          subPaired.remove();
          subFound.remove();
          subDone.remove();

          // Eliminar duplicados por dirección MAC
          const todos = [...paired, ...found];
          const unicos = Array.from(new Map(todos.map(d => [d.address, d])).values());
          
          console.log(`Búsqueda completa: ${unicos.length} dispositivos encontrados`);
          resolve(unicos);
        };

        try {
          // Iniciar el escaneo nativo
          const startResult = await ThermalPrinter.scanDevices();
          
          if (!startResult?.success) {
            console.warn('El escaneo no pudo iniciarse:', startResult?.error);
          }

          // Timeout de seguridad: si no termina en 12 segundos, devolvemos lo que tengamos
          setTimeout(finalizar, 12000);
          
          // Si ya tenemos dispositivos emparejados casi de inmediato, podríamos resolver antes
          // Pero es mejor esperar al menos un poco para encontrar nuevos dispositivos.
          setTimeout(() => {
            if (paired.length > 0 && !resolved) {
              // Si ya tenemos emparejados y pasaron 3 segundos, podemos dejar que el usuario elija
              // mientras el escaneo de nuevos dispositivos continúa en segundo plano (opcional)
              // Por ahora esperamos al evento 'done' o al timeout largo.
            }
          }, 3000);

        } catch (error) {
          subPaired.remove();
          subFound.remove();
          subDone.remove();
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error al buscar dispositivos Bluetooth:', error);
      throw new Error(`No se pudo buscar dispositivos Bluetooth: ${error.message}`);
    }
  }

  /**
   * Construye el documento estructurado para ThermalPrinter.printReceipt()
   * usando los nodos de la librería (text, line, cut, etc.)
   * @param {Object} datos - Datos del comprobante
   * @returns {Array} Array de nodos del documento
   */
  static construirDocumento(datos) {
    const {
      fecha, monto, tipo, cliente, numeroCuenta,
      codigoOperacion, referencia, observacion,
      usuario, negocio, identificacionCliente, nombreServicio
    } = datos;

    const estaticos = this.COMPROBANTE_DATOS_ESTATICOS;
    const codigoOp = codigoOperacion || referencia;
    const nodes = [];

    // Encabezado
    if (estaticos.nombreEmpresa) {
      nodes.push({
        type: 'text',
        content: this.toAsciiTicket(estaticos.nombreEmpresa).toUpperCase(),
        style: { align: 'center', bold: true, size: 'double_height' }
      });
    }
    nodes.push({ type: 'text', content: 'REGULADO Y SUPERVISADO POR LA S.B.S', style: { align: 'center' } });
    if (estaticos.ruc) {
      nodes.push({ type: 'text', content: `RUC:${this.toAsciiTicket(estaticos.ruc)}`, style: { align: 'center' } });
    }
    nodes.push({ type: 'text', content: 'OPERACION REALIZADA EN SU KAYPI', style: { align: 'center' } });
    nodes.push({ type: 'line' });

    // Tipo y monto
    const tipoAscii = this.toAsciiTicket(tipo || 'DEPOSITO EN CUENTA').toUpperCase() || 'DEPOSITO EN CUENTA';
    nodes.push({ type: 'text', content: tipoAscii, style: { align: 'center', bold: true } });
    nodes.push({
      type: 'text',
      content: `S/ ${parseFloat(monto).toFixed(2)}`,
      style: { align: 'center', bold: true, size: 'double' }
    });
    nodes.push({ type: 'line' });

    // Detalle
    const fechaHora = this.normalizarFechaHora(fecha);
    nodes.push({ type: 'text', content: `FECHA Y HORA: ${fechaHora}` });

    const idSocio = this.toAsciiTicket(identificacionCliente);
    if (idSocio !== '') {
      nodes.push({ type: 'text', content: `IDENTIFICACION SOCIO: ${idSocio}` });
    }
    const clienteAscii = this.toAsciiTicket(cliente);
    if (clienteAscii !== '') {
      nodes.push({ type: 'text', content: `NOMBRE DEL SOCIO: ${this.truncarTexto(clienteAscii, this.PRINTER_CONFIG.width - 20)}` });
    }
    if (numeroCuenta != null && String(numeroCuenta).trim() !== '') {
      nodes.push({ type: 'text', content: `NRO DE CUENTA: ${this.toAsciiTicket(this.enmascararNumeroCuenta(numeroCuenta))}` });
    }
    const nombreSrvAscii = this.toAsciiTicket(nombreServicio);
    if (nombreSrvAscii !== '') {
      nodes.push({ type: 'text', content: `SERVICIO: ${this.truncarTexto(nombreSrvAscii, this.PRINTER_CONFIG.width - 12)}` });
    }
    nodes.push({ type: 'text', content: `CODIGO OPERACION: ${this.toAsciiTicket(codigoOp || 'N/A')}` });

    const obsAscii = this.toAsciiTicket(observacion);
    if (obsAscii !== '') {
      nodes.push({ type: 'text', content: `OBSERVACION: :${obsAscii}` });
    }
    nodes.push({ type: 'line' });

    // Pie
    const negocioAscii = this.toAsciiTicket(negocio);
    if (negocioAscii !== '') {
      nodes.push({ type: 'text', content: `NEGOCIO: ${negocioAscii}` });
    }
    const usuarioAscii = this.toAsciiTicket(usuario);
    if (usuarioAscii !== '') {
      nodes.push({ type: 'text', content: `USUARIO: ${usuarioAscii}` });
    }
    if (estaticos.atencionAlSocio) {
      nodes.push({ type: 'text', content: `ATENCION AL SOCIO: ${this.toAsciiTicket(estaticos.atencionAlSocio)}` });
    }

    nodes.push({ type: 'feed', lines: 3 });
    nodes.push({ type: 'cut' });

    return nodes;
  }

  /**
   * Imprime un comprobante de transacción vía Bluetooth
   * @param {Object} comprobante - Datos del comprobante a imprimir
   * @param {string} [comprobante.deviceId] - Dirección MAC del dispositivo Bluetooth
   * @returns {Promise<boolean>} true si la impresión fue exitosa
   */
  static async imprimirComprobante(comprobante) {
    try {
      const datos = {
        fecha: comprobante.fecha,
        referencia: comprobante.referencia,
        monto: comprobante.monto,
        comision: comprobante.comision ?? 0,
        total: comprobante.total,
        tipo: comprobante.tipo || 'Transacción',
        cliente: comprobante.cliente || '',
        numeroCuenta: comprobante.numeroCuenta || '',
        codigoOperacion: comprobante.codigoOperacion || comprobante.referencia,
        observacion: comprobante.observacion || '',
        negocio: comprobante.negocio || '',
        usuario: comprobante.usuario || '',
        identificacionCliente: comprobante.identificacionCliente || '',
        nombreServicio: comprobante.nombreServicio || ''
      };

      if (!ThermalPrinter || typeof ThermalPrinter.printReceipt !== 'function') {
        throw new Error('La librería de impresión Bluetooth no está disponible');
      }

      // Construir documento estructurado
      const documento = this.construirDocumento(datos);

      // Formatear texto plano para log
      const contenido = this.formatearComprobante(datos);
      console.log('Comprobante formateado:', contenido);

      // La dirección debe tener prefijo 'bt:' para Bluetooth Classic o 'ble:' para BLE
      const deviceId = comprobante.deviceId || '';
      const address = (deviceId.startsWith('bt:') || deviceId.startsWith('ble:')) 
        ? deviceId 
        : `bt:${deviceId}`;

      console.log('Enviando a impresora Bluetooth:', address);

      // Usar la API printReceipt de la librería
      const result = await ThermalPrinter.printReceipt({
        printers: [
          {
            address: address,
            options: {
              paperWidthMm: this.PRINTER_CONFIG.paperWidthMm,
              encoding: 'ASCII',
              marginMm: 0,
            },
          },
        ],
        documents: [documento],
      });

      if (!result.success) {
        // Extraer error del resultado
        const printerResult = result.results?.get?.(address);
        const errorMsg = printerResult?.error?.message || 'Error desconocido al imprimir';
        throw new Error(errorMsg);
      }

      console.log('Comprobante enviado exitosamente a la impresora');
      return true;
    } catch (error) {
      console.error('Error al imprimir comprobante:', error);
      throw new Error(`Error al imprimir: ${error.message}`);
    }
  }

  /**
   * Genera comandos ESC/POS para la impresora (formato comprobante).
   * Mantenido para compatibilidad con visualización previa.
   * @param {Object} datos - Datos del comprobante
   * @returns {Array} Array de comandos ESC/POS
   */
  static generarComandosESCPOS(datos) {
    const {
      fecha, referencia, monto, comision, total, tipo, cliente,
      numeroCuenta, codigoOperacion, observacion, usuario, negocio,
      identificacionCliente, nombreServicio
    } = datos;

    const comandos = [];
    const width = this.PRINTER_CONFIG.width;
    const estaticos = this.COMPROBANTE_DATOS_ESTATICOS;
    const codigoOp = codigoOperacion || referencia;
    const separatorLine = '-'.repeat(width);

    comandos.push('\x1B\x40');
    comandos.push('\x1B\x33' + String.fromCharCode(27));
    comandos.push('\x1B\x61\x01');

    if (estaticos.nombreEmpresa) {
      comandos.push('\x1D\x21\x01');
      comandos.push(this.centrarTexto(this.toAsciiTicket(estaticos.nombreEmpresa).toUpperCase(), width) + '\n');
      comandos.push('\x1D\x21\x00');
    }
    comandos.push(this.centrarTexto('REGULADO Y SUPERVISADO POR LA S.B.S', width) + '\n');
    if (estaticos.ruc) comandos.push(`RUC:${this.toAsciiTicket(estaticos.ruc)}\n`);    
    comandos.push(this.centrarTexto('OPERACION REALIZADA EN SU KAYPI', width) + '\n\n');
    comandos.push('\x1B\x61\x00');
    comandos.push(separatorLine + '\n');
    comandos.push('\x1B\x61\x01');
    const tipoAscii = this.toAsciiTicket(tipo || 'DEPOSITO EN CUENTA').toUpperCase() || 'DEPOSITO EN CUENTA';
    comandos.push(this.centrarTexto(tipoAscii, width) + '\n');
    comandos.push('\x1D\x21\x11');
    comandos.push(this.centrarTexto(`S/ ${parseFloat(monto).toFixed(2)}`, width) + '\n');
    comandos.push('\x1D\x21\x00');
    comandos.push('\x1B\x61\x00');
    comandos.push(separatorLine + '\n');
    const fechaHora = this.normalizarFechaHora(fecha);
    comandos.push(`FECHA Y HORA: ${fechaHora}\n`);
    const idSocio = this.toAsciiTicket(identificacionCliente);
    if (idSocio !== '') comandos.push(`IDENTIFICACION SOCIO: ${idSocio}\n`);
    const clienteAscii = this.toAsciiTicket(cliente);
    if (clienteAscii !== '') comandos.push(`NOMBRE DEL SOCIO: ${this.truncarTexto(clienteAscii, width - 20)}\n`);
    if (numeroCuenta != null && String(numeroCuenta).trim() !== '') {
      comandos.push(`NRO DE CUENTA: ${this.toAsciiTicket(this.enmascararNumeroCuenta(numeroCuenta))}\n`);
    }
    const nombreSrvAscii = this.toAsciiTicket(nombreServicio);
    if (nombreSrvAscii !== '') comandos.push(`SERVICIO: ${this.truncarTexto(nombreSrvAscii, width - 12)}\n`);
    comandos.push(`CODIGO OPERACION: ${this.toAsciiTicket(codigoOp || 'N/A')}\n`);
    const obsAscii = this.toAsciiTicket(observacion);
    if (obsAscii !== '') comandos.push(`OBSERVACION: :${obsAscii}\n`);
    comandos.push(separatorLine + '\n');
    const negocioAscii = this.toAsciiTicket(negocio);
    if (negocioAscii !== '') comandos.push(`NEGOCIO: ${negocioAscii}\n`);
    const usuarioAscii = this.toAsciiTicket(usuario);
    if (usuarioAscii !== '') comandos.push(`USUARIO: ${usuarioAscii}\n`);
    if (estaticos.atencionAlSocio) {
      comandos.push(`ATENCION AL SOCIO: ${this.toAsciiTicket(estaticos.atencionAlSocio)}\n`);
    }
    comandos.push('\x1D\x56\x00');
    return comandos;
  }

  /**
   * Formatea el contenido del comprobante para visualización (versión texto plano).
   * @param {Object} datos - Datos del comprobante
   * @returns {string} Contenido formateado
   */
  static formatearComprobante(datos) {
    const {
      fecha, referencia, monto, comision, total, tipo, cliente,
      numeroCuenta, codigoOperacion, observacion, usuario, negocio,
      identificacionCliente, nombreServicio
    } = datos;

    const width = this.PRINTER_CONFIG.width;
    const estaticos = this.COMPROBANTE_DATOS_ESTATICOS;
    const codigoOp = codigoOperacion || referencia;
    const separatorLine = '-'.repeat(width);
    let contenido = '';

    if (estaticos.nombreEmpresa) {
      contenido += this.centrarTexto(this.toAsciiTicket(estaticos.nombreEmpresa).toUpperCase(), width) + '\n';
    }
    if (estaticos.ruc) contenido += `RUC:${this.toAsciiTicket(estaticos.ruc)}\n`;
    contenido += this.centrarTexto('REGULADO Y SUPERVISADO POR LA S.B.S', width) + '\n';
    contenido += this.centrarTexto('OPERACION REALIZADA EN SU KAYPI', width) + '\n\n';
    contenido += separatorLine + '\n';
    const tipoPlano = this.toAsciiTicket(tipo || 'DEPOSITO EN CUENTA').toUpperCase() || 'DEPOSITO EN CUENTA';
    contenido += this.centrarTexto(tipoPlano, width) + '\n';
    contenido += this.centrarTexto(`S/ ${parseFloat(monto).toFixed(2)}`, width) + '\n';
    contenido += separatorLine + '\n';
    const fechaHora = this.normalizarFechaHora(fecha);
    contenido += `FECHA Y HORA: ${fechaHora}\n`;
    const idSocioP = this.toAsciiTicket(identificacionCliente);
    if (idSocioP !== '') contenido += `IDENTIFICACION SOCIO: ${idSocioP}\n`;
    const clienteP = this.toAsciiTicket(cliente);
    if (clienteP !== '') contenido += `NOMBRE DEL SOCIO: ${this.truncarTexto(clienteP, width - 20)}\n`;
    if (numeroCuenta != null && String(numeroCuenta).trim() !== '') {
      contenido += `NRO DE CUENTA: ${this.toAsciiTicket(this.enmascararNumeroCuenta(numeroCuenta))}\n`;
    }
    const nombreSrvP = this.toAsciiTicket(nombreServicio);
    if (nombreSrvP !== '') contenido += `SERVICIO: ${this.truncarTexto(nombreSrvP, width - 12)}\n`;
    contenido += `CODIGO OPERACION: ${this.toAsciiTicket(codigoOp || 'N/A')}\n`;
    const obsP = this.toAsciiTicket(observacion);
    if (obsP !== '') contenido += `OBSERVACION: :${obsP}\n`;
    contenido += separatorLine + '\n';
    const negocioP = this.toAsciiTicket(negocio);
    if (negocioP !== '') contenido += `NEGOCIO: ${negocioP}\n`;
    const usuarioP = this.toAsciiTicket(usuario);
    if (usuarioP !== '') contenido += `USUARIO: ${usuarioP}\n`;
    if (estaticos.atencionAlSocio) {
      contenido += `ATENCION AL SOCIO: ${this.toAsciiTicket(estaticos.atencionAlSocio)}\n`;
    }
    return contenido;
  }

  // ── Métodos utilitarios ──

  static centrarTexto(texto, ancho) {
    const espacios = Math.max(0, Math.floor((ancho - texto.length) / 2));
    return ' '.repeat(espacios) + texto;
  }

  static espacios(cantidad) {
    return ' '.repeat(Math.max(0, cantidad));
  }

  static truncarTexto(texto, maxLength) {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength - 3) + '...';
  }

  static enmascararNumeroCuenta(numeroCuenta) {
    if (!numeroCuenta || typeof numeroCuenta !== 'string') return numeroCuenta || '';
    const s = String(numeroCuenta).trim();
    if (s.length <= 10) return s;
    return s.substring(0, 7) + '*****' + s.substring(s.length - 3);
  }

  static toAsciiTicket(str) {
    if (str == null || str === undefined) return '';
    let s = String(str);
    s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    s = s.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ');
    s = s.replace(/[°º]/g, 'o').replace(/ª/g, 'a');
    s = s.replace(/\n/g, ' ');
    s = s.replace(/[^\x20-\x7E]/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  }

  static normalizarFechaHora(fecha) {
    const ahora = new Date();
    const conHora = () =>
      this.toAsciiTicket(ahora.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'medium' }));
    if (!fecha) return conHora();
    const s = String(fecha).trim();
    if (!s) return conHora();
    if (/:\d{2}/.test(s)) return this.toAsciiTicket(s);
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return this.toAsciiTicket(d.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'medium' }));
    }
    return this.toAsciiTicket(
      s + ' ' + ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  }
}

export default PrintService;
