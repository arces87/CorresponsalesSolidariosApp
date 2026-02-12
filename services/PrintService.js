import { PermissionsAndroid, Platform } from 'react-native';

// Importación condicional de la librería Bluetooth
let BluetoothEscposPrinter = null;
let BluetoothManager = null;
let errorCarga = null;

try {
  const bluetoothModule = require('react-native-bluetooth-escpos-printer');
  console.log('Módulo Bluetooth cargado:', bluetoothModule);
  console.log('Tipo del módulo:', typeof bluetoothModule);
  console.log('Propiedades del módulo:', Object.keys(bluetoothModule || {}));
  
  // La librería puede exportarse de diferentes formas
  const moduleRoot = bluetoothModule.default || bluetoothModule;
  
  // Verificar si el módulo tiene sub-módulos (BluetoothManager, BluetoothEscposPrinter, BluetoothTscPrinter)
  if (moduleRoot && typeof moduleRoot === 'object') {
    // Si tiene BluetoothManager, usarlo para list()
    if (moduleRoot.BluetoothManager) {
      BluetoothManager = moduleRoot.BluetoothManager;
      console.log('✓ BluetoothManager encontrado');
    }
    
    // Si tiene BluetoothEscposPrinter, usarlo para impresión
    if (moduleRoot.BluetoothEscposPrinter) {
      BluetoothEscposPrinter = moduleRoot.BluetoothEscposPrinter;
      console.log('✓ BluetoothEscposPrinter encontrado');
    } else if (typeof moduleRoot.list === 'function') {
      // Si el módulo raíz tiene list(), usarlo directamente
      BluetoothEscposPrinter = moduleRoot;
      BluetoothManager = moduleRoot;
      console.log('✓ Módulo raíz tiene métodos directos');
    } else {
      // Intentar usar el módulo raíz como fallback
      BluetoothEscposPrinter = moduleRoot;
      BluetoothManager = moduleRoot;
      console.log('⚠ Usando módulo raíz como fallback');
    }
  } else {
    BluetoothEscposPrinter = moduleRoot;
    BluetoothManager = moduleRoot;
  }
  
  // Verificar que al menos BluetoothManager tenga el método list()
  if (!BluetoothManager) {
    console.warn('BluetoothManager no está disponible');
    errorCarga = 'El módulo se cargó pero BluetoothManager no está disponible';
    BluetoothEscposPrinter = null;
    BluetoothManager = null;
  } else if (typeof BluetoothManager.list !== 'function') {
    console.warn('BluetoothManager no tiene el método list()');
    console.warn('Propiedades de BluetoothManager:', Object.keys(BluetoothManager || {}));
    const metodosDisponibles = Object.keys(bluetoothModule || {}).join(', ');
    errorCarga = `El módulo no tiene el método list(). Métodos disponibles: ${metodosDisponibles}`;
    BluetoothEscposPrinter = null;
    BluetoothManager = null;
  } else {
    console.log('✓ Librería Bluetooth cargada correctamente');
    console.log('Métodos de BluetoothManager:', Object.keys(BluetoothManager || {}));
    if (BluetoothEscposPrinter) {
      console.log('Métodos de BluetoothEscposPrinter:', Object.keys(BluetoothEscposPrinter || {}));
    }
  }
} catch (error) {
  console.error('Error al cargar react-native-bluetooth-escpos-printer:', error);
  console.error('Stack trace:', error.stack);
  errorCarga = error.message || String(error);
  BluetoothEscposPrinter = null;
  BluetoothManager = null;
}

/**
 * Servicio para manejar la impresión de comprobantes a través de impresoras Bluetooth
 * Específicamente diseñado para la impresora térmica ADV7011
 * 
 * Características de la ADV7011:
 * - Tecnología: Térmica
 * - Velocidad: 90mm/s
 * - Conectividad: Bluetooth/USB
 * - Ancho de papel: 58mm (estándar para recibos)
 * 
 * NOTA: Este servicio requiere la instalación de una librería de impresión Bluetooth.
 * Librería recomendada: react-native-bluetooth-escpos-printer
 * 
 * Instalación:
 * npm install react-native-bluetooth-escpos-printer
 * 
 * Para usar con Expo, se necesita crear un módulo de desarrollo personalizado.
 */
class PrintService {
  // Configuración específica para ADV7011
  static PRINTER_CONFIG = {
    width: 48, // Ancho de caracteres (58mm papel = ~48 caracteres)
    encoding: 'UTF-8',
    speed: 90, // mm/s
  };

  // Almacenar el dispositivo conectado
  static dispositivoConectado = null;
  /**
   * Busca dispositivos Bluetooth disponibles
   * @returns {Promise<Array>} Lista de dispositivos Bluetooth disponibles
   */
  static async buscarDispositivosBluetooth() {
    try {
      console.log('Buscando dispositivos Bluetooth...');
      
      if (Platform.OS !== 'android') {
        throw new Error('La impresión Bluetooth solo está disponible en Android');
      }

      if (!BluetoothManager) {
        throw new Error('La librería de impresión Bluetooth no está disponible. Por favor, reconstruya la aplicación.');
      }

      // Buscar dispositivos Bluetooth emparejados usando BluetoothManager
      const dispositivos = await BluetoothManager.list();
      
      console.log('Dispositivos encontrados:', dispositivos);
      
      // Filtrar dispositivos que puedan ser impresoras (buscar nombres comunes)
      const impresoras = dispositivos.filter(device => {
        const nombre = (device.name || '').toUpperCase();
        return nombre.includes('ADV') || 
               nombre.includes('PRINTER') || 
               nombre.includes('PRINT') ||
               nombre.includes('POS') ||
               nombre.includes('THERMAL');
      });

      return impresoras.length > 0 ? impresoras : dispositivos;
    } catch (error) {
      console.error('Error al buscar dispositivos Bluetooth:', error);
      throw new Error(`No se pudo buscar dispositivos Bluetooth: ${error.message}`);
    }
  }

  /**
   * Conecta a una impresora Bluetooth
   * @param {string} deviceId - ID del dispositivo Bluetooth
   * @returns {Promise<boolean>} true si la conexión fue exitosa
   */
  static async conectarImpresora(deviceId) {
    try {
      console.log('Conectando a impresora:', deviceId);
      
      if (Platform.OS !== 'android') {
        throw new Error('La impresión Bluetooth solo está disponible en Android');
      }

      if (!BluetoothEscposPrinter) {
        throw new Error('La librería de impresión Bluetooth no está disponible. Por favor, reconstruya la aplicación.');
      }

      // Desconectar si hay una conexión previa
      if (this.dispositivoConectado) {
        await this.desconectarImpresora();
      }

      // Conectar al dispositivo
      await BluetoothEscposPrinter.connect(deviceId);
      
      this.dispositivoConectado = deviceId;
      console.log('Conectado exitosamente a la impresora:', deviceId);
      
      return true;
    } catch (error) {
      console.error('Error al conectar a la impresora:', error);
      this.dispositivoConectado = null;
      throw new Error(`No se pudo conectar a la impresora: ${error.message}`);
    }
  }

  /**
   * Desconecta la impresora Bluetooth actual
   * @returns {Promise<boolean>} true si la desconexión fue exitosa
   */
  static async desconectarImpresora() {
    try {
      if (!this.dispositivoConectado) {
        return true;
      }

      if (!BluetoothEscposPrinter) {
        this.dispositivoConectado = null;
        return true;
      }

      console.log('Desconectando impresora...');
      await BluetoothEscposPrinter.disconnect();
      this.dispositivoConectado = null;
      console.log('Desconectado exitosamente');
      return true;
    } catch (error) {
      console.error('Error al desconectar la impresora:', error);
      this.dispositivoConectado = null;
      return false;
    }
  }

  /**
   * Verifica si hay una impresora conectada
   * @returns {boolean} true si hay una impresora conectada
   */
  static estaConectado() {
    return this.dispositivoConectado !== null;
  }

  /**
   * Imprime un comprobante de transacción
   * @param {Object} comprobante - Datos del comprobante a imprimir
   * @param {string} comprobante.fecha - Fecha de la transacción
   * @param {string} comprobante.referencia - Número de comprobante
   * @param {number} comprobante.monto - Monto de la transacción
   * @param {number} comprobante.comision - Comisión
   * @param {number} comprobante.total - Total
   * @param {string} [comprobante.tipo] - Tipo de transacción (opcional)
   * @param {string} [comprobante.cliente] - Nombre del cliente (opcional)
   * @returns {Promise<boolean>} true si la impresión fue exitosa
   */
  static async imprimirComprobante(comprobante) {
    try {
      const {
        fecha,
        referencia,
        monto,
        comision,
        total,
        tipo = 'Transacción',
        cliente = ''
      } = comprobante;

      // Generar comandos ESC/POS para la impresora ADV7011
      const comandos = this.generarComandosESCPOS({
        fecha,
        referencia,
        monto,
        comision,
        total,
        tipo,
        cliente
      });

      // Formatear también para visualización (texto plano)
      const contenido = this.formatearComprobante({
        fecha,
        referencia,
        monto,
        comision,
        total,
        tipo,
        cliente
      });

      console.log('Comprobante formateado para ADV7011:', contenido);
      console.log('Comandos ESC/POS generados:', comandos.length, 'comandos');

      // Verificar si hay una impresora conectada
      if (!this.dispositivoConectado) {
        // Buscar y conectar a una impresora automáticamente
        const dispositivos = await this.buscarDispositivosBluetooth();
        
        if (dispositivos.length === 0) {
          throw new Error(
            'No se encontraron dispositivos Bluetooth disponibles.\n\n' +
            'Por favor:\n' +
            '1. Active Bluetooth en su dispositivo\n' +
            '2. Asegúrese de que la impresora ADV7011 esté encendida\n' +
            '3. Empareje la impresora con su dispositivo\n' +
            '4. Intente nuevamente'
          );
        }

        // Intentar conectar a la primera impresora encontrada
        // Si hay varias, preferir una que contenga "ADV" en el nombre
        let impresoraSeleccionada = dispositivos.find(d => 
          (d.name || '').toUpperCase().includes('ADV')
        ) || dispositivos[0];

        try {
          await this.conectarImpresora(impresoraSeleccionada.address || impresoraSeleccionada.id);
        } catch (error) {
          throw new Error(
            `No se pudo conectar a la impresora ${impresoraSeleccionada.name || 'seleccionada'}.\n\n` +
            `Error: ${error.message}\n\n` +
            'Por favor, verifique que la impresora esté encendida y emparejada.'
          );
        }
      }

      // Enviar comandos ESC/POS a la impresora
      try {
        if (!BluetoothEscposPrinter) {
          throw new Error('La librería de impresión Bluetooth no está disponible');
        }

        console.log('Enviando comandos a la impresora...');
        
        // Combinar todos los comandos en un solo string
        const textoCompleto = comandos.join('');
        
        // Verificar que printText esté disponible
        if (!BluetoothEscposPrinter.printText) {
          throw new Error('El método printText no está disponible en la librería');
        }

        // Enviar el texto completo a la impresora
        // La librería puede requerir diferentes formatos según la versión
        try {
          // Intentar primero con el formato estándar (texto, opciones)
          if (BluetoothEscposPrinter.printText && typeof BluetoothEscposPrinter.printText === 'function') {
            // Algunas versiones requieren opciones específicas, otras no
            try {
              await BluetoothEscposPrinter.printText(textoCompleto, { encoding: 'UTF-8' });
            } catch (optsError) {
              // Si falla con opciones, intentar sin opciones
              console.warn('Error con opciones, intentando sin opciones:', optsError);
              await BluetoothEscposPrinter.printText(textoCompleto);
            }
          } else if (BluetoothEscposPrinter.print) {
            // Algunas versiones usan 'print' en lugar de 'printText'
            await BluetoothEscposPrinter.print(textoCompleto);
          } else {
            throw new Error('No se encontró método de impresión disponible en la librería');
          }
        } catch (printError) {
          console.error('Error detallado al imprimir:', printError);
          throw printError;
        }
        
        console.log('Comprobante enviado exitosamente a la impresora');
        return true;
      } catch (error) {
        console.error('Error al enviar a la impresora:', error);
        // Intentar desconectar en caso de error
        try {
          await this.desconectarImpresora();
        } catch (disconnectError) {
          console.error('Error al desconectar:', disconnectError);
        }
        throw new Error(`Error al imprimir: ${error.message}`);
      }
    } catch (error) {
      console.error('Error al imprimir comprobante:', error);
      throw error; // Lanzar el error para que lo maneje el componente que llama
    }
  }

  /**
   * Genera comandos ESC/POS para la impresora térmica ADV7011
   * @param {Object} datos - Datos del comprobante
   * @returns {Array} Array de comandos ESC/POS
   */
  static generarComandosESCPOS(datos) {
    const {
      fecha,
      referencia,
      monto,
      comision,
      total,
      tipo,
      cliente
    } = datos;

    const comandos = [];
    const width = this.PRINTER_CONFIG.width;

    // Inicializar impresora (ESC @)
    comandos.push('\x1B\x40'); // Reset printer
    
    // Centrar texto (ESC a 1)
    comandos.push('\x1B\x61\x01'); // Center align
    
    // Texto grande para título (GS ! 0x11 = doble altura y ancho)
    comandos.push('\x1D\x21\x11'); // Double width and height
    comandos.push('COMPROBANTE\n');
    comandos.push('DE TRANSACCION\n');
    
    // Reset formato
    comandos.push('\x1D\x21\x00'); // Normal size
    comandos.push('\x1B\x61\x00'); // Left align
    comandos.push('────────────────────────────\n');
    
    // Información de la transacción
    comandos.push(`Tipo: ${tipo}\n`);
    if (cliente) {
      comandos.push(`Cliente: ${this.truncarTexto(cliente, width - 10)}\n`);
    }
    comandos.push(`Fecha: ${fecha}\n`);
    comandos.push(`N°: ${referencia}\n`);
    comandos.push('────────────────────────────\n');
    
    // Detalles con formato de tabla
    comandos.push('Detalle          Valor\n');
    comandos.push('────────────────────────────\n');
    
    // Monto
    const montoStr = `$${parseFloat(monto).toFixed(2)}`;
    comandos.push(`Monto${this.espacios(width - 10 - montoStr.length)}${montoStr}\n`);
    
    // Comisión
    const comisionStr = `$${parseFloat(comision).toFixed(2)}`;
    comandos.push(`Comision${this.espacios(width - 10 - comisionStr.length)}${comisionStr}\n`);
    
    comandos.push('────────────────────────────\n');
    
    // Total en negrita
    comandos.push('\x1B\x45\x01'); // Bold on
    const totalStr = `$${parseFloat(total).toFixed(2)}`;
    comandos.push(`TOTAL${this.espacios(width - 6 - totalStr.length)}${totalStr}\n`);
    comandos.push('\x1B\x45\x00'); // Bold off
    comandos.push('────────────────────────────\n\n');
    
    // Pie de página
    comandos.push('\x1B\x61\x01'); // Center align
    comandos.push('Este comprobante es válido\n');
    comandos.push('como constancia de la\n');
    comandos.push('transacción realizada.\n\n');
    
    comandos.push('\x1B\x61\x00'); // Left align
    comandos.push('────────────────────────────\n');
    comandos.push(`Fecha imp: ${new Date().toLocaleString('es-EC')}\n`);
    comandos.push('────────────────────────────\n\n');
    
    // Cortar papel (GS V 0)
    comandos.push('\x1D\x56\x00'); // Cut paper
    
    return comandos;
  }

  /**
   * Formatea el contenido del comprobante para impresión (versión texto plano)
   * @param {Object} datos - Datos del comprobante
   * @returns {string} Contenido formateado
   */
  static formatearComprobante(datos) {
    const {
      fecha,
      referencia,
      monto,
      comision,
      total,
      tipo,
      cliente
    } = datos;

    const width = this.PRINTER_CONFIG.width;
    let contenido = '';
    
    // Encabezado centrado
    contenido += this.centrarTexto('COMPROBANTE', width) + '\n';
    contenido += this.centrarTexto('DE TRANSACCION', width) + '\n';
    contenido += '────────────────────────────\n';
    
    // Información de la transacción
    contenido += `Tipo: ${tipo}\n`;
    if (cliente) {
      contenido += `Cliente: ${this.truncarTexto(cliente, width - 10)}\n`;
    }
    contenido += `Fecha: ${fecha}\n`;
    contenido += `N°: ${referencia}\n`;
    contenido += '────────────────────────────\n';
    
    // Detalles
    contenido += 'Detalle          Valor\n';
    contenido += '────────────────────────────\n';
    
    const montoStr = `$${parseFloat(monto).toFixed(2)}`;
    contenido += `Monto${this.espacios(width - 10 - montoStr.length)}${montoStr}\n`;
    
    const comisionStr = `$${parseFloat(comision).toFixed(2)}`;
    contenido += `Comision${this.espacios(width - 10 - comisionStr.length)}${comisionStr}\n`;
    
    contenido += '────────────────────────────\n';
    
    const totalStr = `$${parseFloat(total).toFixed(2)}`;
    contenido += `TOTAL${this.espacios(width - 6 - totalStr.length)}${totalStr}\n`;
    contenido += '────────────────────────────\n\n';
    
    // Pie de página
    contenido += this.centrarTexto('Este comprobante es válido', width) + '\n';
    contenido += this.centrarTexto('como constancia de la', width) + '\n';
    contenido += this.centrarTexto('transacción realizada.', width) + '\n\n';
    contenido += '────────────────────────────\n';
    contenido += `Fecha imp: ${new Date().toLocaleString('es-EC')}\n`;
    contenido += '────────────────────────────\n';

    return contenido;
  }

  /**
   * Centra un texto según el ancho de la impresora
   * @param {string} texto - Texto a centrar
   * @param {number} ancho - Ancho total
   * @returns {string} Texto centrado
   */
  static centrarTexto(texto, ancho) {
    const espacios = Math.max(0, Math.floor((ancho - texto.length) / 2));
    return ' '.repeat(espacios) + texto;
  }

  /**
   * Genera espacios para alineación
   * @param {number} cantidad - Cantidad de espacios
   * @returns {string} Cadena de espacios
   */
  static espacios(cantidad) {
    return ' '.repeat(Math.max(0, cantidad));
  }

  /**
   * Trunca un texto si excede el largo máximo
   * @param {string} texto - Texto a truncar
   * @param {number} maxLength - Longitud máxima
   * @returns {string} Texto truncado
   */
  static truncarTexto(texto, maxLength) {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength - 3) + '...';
  }

  /**
   * Solicita los permisos de Bluetooth necesarios
   * @returns {Promise<boolean>} true si los permisos fueron concedidos
   * @throws {Error} Si los permisos fueron denegados
   */
  static async solicitarPermisosBluetooth() {
    if (Platform.OS !== 'android') {
      return true; // No se necesitan permisos en otras plataformas
    }

    try {
      const androidVersion = Platform.Version;
      
      // Para Android 12+ (API 31+), se necesitan permisos diferentes
      if (androidVersion >= 31) {
        // Los permisos de Android 12+ pueden no estar en PermissionsAndroid.PERMISSIONS
        // Usamos las constantes directamente
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
              '4. Vuelva a intentar la prueba'
            );
          }

          return true;
        } catch (error) {
          if (error.message && error.message.includes('Se requieren permisos')) {
            throw error;
          }
          // Si falla la solicitud de permisos, intentar continuar de todos modos
          // ya que algunos dispositivos pueden tener los permisos ya concedidos
          console.warn('Advertencia al solicitar permisos:', error);
          return true;
        }
      } else {
        // Para Android 6-11, se necesitan permisos de ubicación para escanear Bluetooth
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
      if (error.message) {
        throw error;
      }
      throw new Error(
        'No se pudieron solicitar los permisos de Bluetooth.\n\n' +
        'Por favor, conceda los permisos manualmente en Configuración > Aplicaciones.'
      );
    }
  }

  /**
   * Verifica si Bluetooth está disponible y habilitado
   * @returns {Promise<boolean>} true si Bluetooth está disponible
   * @throws {Error} Si hay un problema específico con Bluetooth o la librería
   */
  static async verificarBluetooth() {
    if (Platform.OS !== 'android') {
      throw new Error('La impresión Bluetooth solo está disponible en Android');
    }

    if (!BluetoothManager || !BluetoothEscposPrinter) {
      console.error('BluetoothManager o BluetoothEscposPrinter no está disponible');
      console.error('Platform.OS:', Platform.OS);
      console.error('Platform.Version:', Platform.Version);
      console.error('Error de carga:', errorCarga);
      console.error('BluetoothManager disponible:', !!BluetoothManager);
      console.error('BluetoothEscposPrinter disponible:', !!BluetoothEscposPrinter);
      
      let mensajeError = 'La librería de impresión Bluetooth no está disponible.\n\n';
      mensajeError += 'Diagnóstico:\n';
      mensajeError += `- Plataforma: ${Platform.OS}\n`;
      mensajeError += `- Versión Android: ${Platform.OS === 'android' ? Platform.Version : 'N/A'}\n`;
      if (errorCarga) {
        mensajeError += `- Error al cargar: ${errorCarga}\n`;
      }
      mensajeError += '\n';
      
      mensajeError += 'Posibles causas:\n';
      mensajeError += '1. La librería no está instalada o vinculada correctamente\n';
      mensajeError += '2. El código nativo no está compilado (requiere rebuild)\n';
      mensajeError += '3. Está usando Expo Go (no compatible con módulos nativos)\n';
      mensajeError += '4. La librería no está correctamente configurada en build.gradle\n\n';
      
      mensajeError += '⚠️ PROBLEMA DETECTADO:\n';
      mensajeError += 'La librería react-native-bluetooth-escpos-printer (v0.0.5)\n';
      mensajeError += 'puede no ser compatible con React Native 0.79.6 y Expo 53.\n\n';
      
      mensajeError += 'VERIFICACIONES INMEDIATAS:\n';
      mensajeError += '1. Verifique en la consola de Metro/React Native si hay errores\n';
      mensajeError += '   relacionados con "react-native-bluetooth-escpos-printer"\n\n';
      mensajeError += '2. Verifique que la librería esté en node_modules:\n';
      mensajeError += '   ls node_modules/react-native-bluetooth-escpos-printer\n\n';
      mensajeError += '3. Revise los logs de Android Studio o adb logcat para ver\n';
      mensajeError += '   si hay errores de carga del módulo nativo\n\n';
      
      mensajeError += 'SOLUCIONES PASO A PASO:\n';
      mensajeError += '1. Reinstale la librería:\n';
      mensajeError += '   npm uninstall react-native-bluetooth-escpos-printer\n';
      mensajeError += '   npm install react-native-bluetooth-escpos-printer@^0.0.5\n\n';
      mensajeError += '2. Limpie completamente el proyecto:\n';
      mensajeError += '   cd android\n';
      mensajeError += '   ./gradlew clean\n';
      mensajeError += '   cd ..\n';
      mensajeError += '   rm -rf node_modules\n';
      mensajeError += '   npm install\n\n';
      mensajeError += '3. Reconstruya la aplicación:\n';
      mensajeError += '   npx expo run:android\n\n';
      mensajeError += '4. IMPORTANTE: NO use Expo Go. Debe usar:\n';
      mensajeError += '   - Development build (npx expo run:android)\n';
      mensajeError += '   - O build de producción\n\n';
      mensajeError += '5. Si el problema persiste, la librería puede necesitar\n';
      mensajeError += '   vinculación manual. Verifique:\n';
      mensajeError += '   - android/settings.gradle (debe incluir el módulo)\n';
      mensajeError += '   - android/app/build.gradle (dependencias)\n';
      mensajeError += '   - MainApplication.kt (registro del paquete)\n\n';
      mensajeError += '6. ALTERNATIVA: Considere usar una librería más moderna:\n';
      mensajeError += '   - @react-native-bluetooth/bluetooth (si existe)\n';
      mensajeError += '   - O una librería específica para impresoras ESC/POS\n\n';
      mensajeError += '7. Revise los logs completos en:\n';
      mensajeError += '   - Metro bundler (terminal donde ejecuta expo start)\n';
      mensajeError += '   - Android Studio Logcat\n';
      mensajeError += '   - adb logcat | grep -i bluetooth';
      
      throw new Error(mensajeError);
    }

    // Verificar que los métodos necesarios estén disponibles
    console.log('Verificando métodos de BluetoothManager y BluetoothEscposPrinter...');
    if (BluetoothManager) {
      console.log('Métodos disponibles en BluetoothManager:', Object.keys(BluetoothManager));
      console.log('list disponible:', typeof BluetoothManager.list);
    }
    if (BluetoothEscposPrinter) {
      console.log('Métodos disponibles en BluetoothEscposPrinter:', Object.keys(BluetoothEscposPrinter));
      console.log('connect disponible:', typeof BluetoothEscposPrinter.connect);
    }
    
    if (!BluetoothManager || !BluetoothManager.list || typeof BluetoothManager.list !== 'function') {
      const metodosDisponibles = BluetoothManager ? Object.keys(BluetoothManager).join(', ') : 'ninguno';
      throw new Error(
        'La librería de impresión no está correctamente inicializada.\n\n' +
        'El método list() no está disponible en BluetoothManager.\n' +
        `Métodos disponibles: ${metodosDisponibles}\n\n` +
        'Por favor:\n' +
        '1. Verifique que la librería esté correctamente instalada\n' +
        '2. Reconstruya la aplicación: npx expo run:android\n' +
        '3. Verifique que NO esté usando Expo Go (requiere build nativo)\n' +
        '4. Limpie el build: cd android && ./gradlew clean && cd ..\n' +
        '5. Reconstruya: npx expo run:android'
      );
    }

    // Solicitar permisos primero
    try {
      await this.solicitarPermisosBluetooth();
    } catch (permisoError) {
      throw permisoError; // Re-lanzar el error de permisos
    }

    // Verificar si Bluetooth está habilitado intentando listar dispositivos
    try {
      await BluetoothManager.list();
      return true;
    } catch (error) {
      console.error('Error al verificar Bluetooth:', error);
      const errorMsg = error.message || String(error);
      const errorStr = String(error).toLowerCase();
      
      if (errorMsg.includes('Bluetooth') || errorStr.includes('bluetooth')) {
        throw new Error(
          'Bluetooth no está disponible o no está activado.\n\n' +
          'Por favor:\n' +
          '1. Active Bluetooth en la configuración de su dispositivo\n' +
          '2. Asegúrese de que los permisos de Bluetooth estén concedidos a la aplicación\n' +
          '3. Verifique que Bluetooth esté funcionando correctamente en su dispositivo'
        );
      } else if (errorMsg.includes('DIRECTION') || errorMsg.includes('undefined') || errorStr.includes('permission')) {
        throw new Error(
          'Error de permisos o inicialización de Bluetooth.\n\n' +
          'Por favor:\n' +
          '1. Verifique que los permisos de Bluetooth estén configurados en AndroidManifest.xml:\n' +
          '   - BLUETOOTH\n' +
          '   - BLUETOOTH_ADMIN\n' +
          '   - BLUETOOTH_CONNECT (Android 12+)\n' +
          '   - BLUETOOTH_SCAN (Android 12+)\n' +
          '2. Conceda los permisos manualmente en Configuración > Aplicaciones\n' +
          '3. Reconstruya la aplicación: npx expo run:android'
        );
      } else if (errorStr.includes('not found') || errorStr.includes('module')) {
        throw new Error(
          'La librería de impresión no se encuentra.\n\n' +
          'Por favor:\n' +
          '1. Instale la librería: npm install react-native-bluetooth-escpos-printer\n' +
          '2. Reconstruya la aplicación: npx expo run:android\n' +
          '3. No use Expo Go, requiere un build nativo'
        );
      }
      
      // Error genérico con detalles
      throw new Error(
        `Error al verificar Bluetooth: ${errorMsg}\n\n` +
        'Por favor, verifique:\n' +
        '1. Que Bluetooth esté activado\n' +
        '2. Que los permisos estén concedidos\n' +
        '3. Que la librería esté correctamente instalada'
      );
    }
  }
}

export default PrintService;
