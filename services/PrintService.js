import { Platform } from 'react-native';

// Importación condicional de la librería Bluetooth
let BluetoothEscposPrinter = null;
try {
  const bluetoothModule = require('react-native-bluetooth-escpos-printer');
  // La librería puede exportarse de diferentes formas
  BluetoothEscposPrinter = bluetoothModule.default || bluetoothModule;
  
  // Verificar que la librería esté correctamente cargada
  if (!BluetoothEscposPrinter || typeof BluetoothEscposPrinter.list !== 'function') {
    console.warn('La librería Bluetooth no está correctamente inicializada');
    BluetoothEscposPrinter = null;
  }
} catch (error) {
  console.warn('No se pudo cargar react-native-bluetooth-escpos-printer:', error);
  BluetoothEscposPrinter = null;
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

      if (!BluetoothEscposPrinter) {
        throw new Error('La librería de impresión Bluetooth no está disponible. Por favor, reconstruya la aplicación.');
      }

      // Buscar dispositivos Bluetooth emparejados
      const dispositivos = await BluetoothEscposPrinter.list();
      
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
   * Verifica si Bluetooth está disponible y habilitado
   * @returns {Promise<boolean>} true si Bluetooth está disponible
   */
  static async verificarBluetooth() {
    try {
      if (Platform.OS !== 'android') {
        throw new Error('La impresión Bluetooth solo está disponible en Android');
      }

      if (!BluetoothEscposPrinter) {
        throw new Error(
          'La librería de impresión Bluetooth no está disponible.\n\n' +
          'Por favor:\n' +
          '1. Asegúrese de haber ejecutado: npm install\n' +
          '2. Reconstruya la aplicación: npx expo run:android\n' +
          '3. La librería requiere código nativo y no funcionará en Expo Go'
        );
      }

      // Verificar que los métodos necesarios estén disponibles
      if (!BluetoothEscposPrinter.list || typeof BluetoothEscposPrinter.list !== 'function') {
        throw new Error(
          'La librería de impresión no está correctamente inicializada.\n\n' +
          'Por favor, reconstruya la aplicación nativa.'
        );
      }

      // Verificar si Bluetooth está habilitado intentando listar dispositivos
      try {
        await BluetoothEscposPrinter.list();
        return true;
      } catch (error) {
        console.error('Error al verificar Bluetooth:', error);
        const errorMsg = error.message || String(error);
        if (errorMsg.includes('Bluetooth') || errorMsg.includes('bluetooth')) {
          throw new Error('Por favor, active Bluetooth en su dispositivo para usar la impresión.');
        } else if (errorMsg.includes('DIRECTION') || errorMsg.includes('undefined')) {
          throw new Error(
            'La librería de impresión no está correctamente inicializada.\n\n' +
            'Por favor, reconstruya la aplicación: npx expo run:android'
          );
        }
        throw error;
      }
    } catch (error) {
      console.error('Error al verificar Bluetooth:', error);
      return false;
    }
  }
}

export default PrintService;
