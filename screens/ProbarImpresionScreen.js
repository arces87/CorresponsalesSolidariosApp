import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BluetoothDeviceSelectorModal from '../components/BluetoothDeviceSelectorModal';
import CustomModal from '../components/CustomModal';
import { useCustomModal } from '../hooks/useCustomModal';
import PrintService from '../services/PrintService';
import { colors, globalStyles } from '../styles/globalStyles';

/** Escapa texto para HTML (PDF); igual criterio que ComprobanteScreen */
function escapeHtml(text) {
  if (text == null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Mismo shape que ComprobanteScreen → PrintService.imprimirComprobante (datos de prueba fijos).
 * Así el ticket de prueba incluye todas las líneas que un comprobante real (identificación, cuenta, etc.).
 */
function createComprobantePrueba() {
  const ref = 'PRUEBA-' + Date.now();
  const fecha = new Date().toLocaleString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return {
    fecha,
    referencia: ref,
    monto: 100.0,
    comision: 5.0,
    total: 105.0,
    tipo: 'PRUEBA DE IMPRESION',
    cliente: 'SOCIO DE PRUEBA',
    numeroCuenta: '1630071234567',
    codigoOperacion: ref,
    observacion: 'OBSERVACION DE PRUEBA',
    usuario: 'USUARIO_PRUEBA',
    negocio: 'NEGOCIO PRUEBA',
    identificacionCliente: '1234567890',
    deviceId: null,
  };
}

export default function ProbarImpresionScreen() {
  const router = useRouter();
  const [guardandoPdf, setGuardandoPdf] = useState(false);
  const [imprimiendoBluetooth, setImprimiendoBluetooth] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [dispositivosBluetooth, setDispositivosBluetooth] = useState([]);
  const [deviceIdEnImpresion, setDeviceIdEnImpresion] = useState(null);
  const [lastPrinterId, setLastPrinterId] = useState(null);
  const { modalVisible, modalData, mostrarError, mostrarInfo, mostrarExito, cerrarModal } = useCustomModal();
  const ocupado = guardandoPdf || imprimiendoBluetooth;
 
  // Cargar la última impresora seleccionada al montar
  React.useEffect(() => {
    const cargarPreferencia = async () => {
      const id = await PrintService.obtenerUltimaImpresora();
      if (id) setLastPrinterId(id);
    };
    cargarPreferencia();
  }, []);

  /** Misma estructura y criterios (toAsciiTicket, etiquetas ASCII) que ComprobanteScreen.buildComprobanteHtml */
  const buildComprobantePruebaHtml = () => {
    const c = createComprobantePrueba();
    const estaticos = PrintService.COMPROBANTE_DATOS_ESTATICOS;
    const tipoAscii =
      PrintService.toAsciiTicket(c.tipo || 'DEPOSITO EN CUENTA').toUpperCase() || 'DEPOSITO EN CUENTA';
    const montoStr = `S/ ${(parseFloat(c.monto) || 0).toFixed(2)}`;
    const fechaHora = PrintService.normalizarFechaHora(c.fecha);
    const codigoOp = PrintService.toAsciiTicket(c.codigoOperacion || c.referencia || 'N/A');
    const idSocio = PrintService.toAsciiTicket(c.identificacionCliente);
    const nombreSocioAscii = PrintService.toAsciiTicket(c.cliente);
    const cuentaEnmascarada = c.numeroCuenta
      ? PrintService.toAsciiTicket(PrintService.enmascararNumeroCuenta(c.numeroCuenta))
      : '';
    const observacionStr = c.observacion ? `:${PrintService.toAsciiTicket(c.observacion)}` : '';
    const negocioStr = PrintService.toAsciiTicket(c.negocio);
    const usuarioAscii = PrintService.toAsciiTicket(c.usuario);
    const nombreEmpresaDisplay = PrintService.toAsciiTicket(estaticos.nombreEmpresa).toUpperCase();
    const rucDisplay = PrintService.toAsciiTicket(estaticos.ruc);
    const atencionDisplay = PrintService.toAsciiTicket(estaticos.atencionAlSocio);

    const rows = [];
    if (nombreEmpresaDisplay) {
      rows.push(
        `<tr><td colspan="2" style="text-align:center;font-weight:bold;font-size:14px;">${escapeHtml(nombreEmpresaDisplay)}</td></tr>`
      );
    }
    rows.push(`<tr><td colspan="2" style="text-align:center;font-size:11px;">REGULADO Y SUPERVISADO POR LA S.B.S</td></tr>`);
    if (rucDisplay) {
      rows.push(`<tr><td colspan="2" style="text-align:center;">RUC: ${escapeHtml(rucDisplay)}</td></tr>`);
    }
    rows.push(
      `<tr><td colspan="2" style="text-align:center;font-size:11px;">OPERACION REALIZADA EN SU KAYPI</td></tr>`
    );
    rows.push(`<tr><td colspan="2"><hr/></td></tr>`);
    rows.push(`<tr><td colspan="2" style="text-align:center;font-weight:bold;">${escapeHtml(tipoAscii)}</td></tr>`);
    rows.push(
      `<tr><td colspan="2" style="text-align:center;font-size:16px;font-weight:bold;">${escapeHtml(montoStr)}</td></tr>`
    );
    rows.push(`<tr><td colspan="2"><hr/></td></tr>`);
    rows.push(`<tr><td style="font-weight:bold;">FECHA Y HORA:</td><td>${escapeHtml(fechaHora)}</td></tr>`);
    if (idSocio !== '') {
      rows.push(
        `<tr><td style="font-weight:bold;">IDENTIFICACION SOCIO:</td><td>${escapeHtml(idSocio)}</td></tr>`
      );
    }
    if (nombreSocioAscii !== '') {
      rows.push(
        `<tr><td style="font-weight:bold;">NOMBRE DEL SOCIO:</td><td>${escapeHtml(nombreSocioAscii)}</td></tr>`
      );
    }
    if (cuentaEnmascarada) {
      rows.push(
        `<tr><td style="font-weight:bold;">NRO DE CUENTA:</td><td>${escapeHtml(cuentaEnmascarada)}</td></tr>`
      );
    }
    rows.push(
      `<tr><td style="font-weight:bold;">CODIGO OPERACION:</td><td>${escapeHtml(codigoOp)}</td></tr>`
    );
    if (observacionStr !== '') {
      rows.push(
        `<tr><td style="font-weight:bold;">OBSERVACION:</td><td>${escapeHtml(observacionStr)}</td></tr>`
      );
    }
    rows.push(`<tr><td colspan="2"><hr/></td></tr>`);
    if (negocioStr !== '') {
      rows.push(`<tr><td colspan="2">NEGOCIO: ${escapeHtml(negocioStr)}</td></tr>`);
    }
    if (usuarioAscii !== '') {
      rows.push(`<tr><td colspan="2">USUARIO: ${escapeHtml(usuarioAscii)}</td></tr>`);
    }
    if (atencionDisplay) {
      rows.push(`<tr><td colspan="2">ATENCION AL SOCIO: ${escapeHtml(atencionDisplay)}</td></tr>`);
    }
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Comprobante de prueba</title></head>
<body style="font-family:sans-serif;font-size:12px;padding:20px;">
<table width="100%" cellpadding="4" cellspacing="0">${rows.join('')}</table>
</body>
</html>`;
  };

  const shareComprobantePruebaPdf = async (dialogTitle) => {
    const html = buildComprobantePruebaHtml();
    const { uri } = await Print.printToFileAsync({ html, width: 300 });
    const puedeCompartir = await Sharing.isAvailableAsync();
    if (!puedeCompartir) {
      mostrarExito(
        'Comprobante generado',
        'El PDF se generó correctamente. Puede abrirlo desde la ubicación del archivo.'
      );
      return;
    }
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle,
    });
  };

  const handleImpresionConApp = async () => {
    if (Platform.OS === 'web') {
      mostrarInfo('No disponible', 'Impresión con app no está disponible en la versión web.');
      return;
    }
    setGuardandoPdf(true);
    try {
      await shareComprobantePruebaPdf('Imprimir comprobante de prueba con app');
      mostrarExito('Compartido', 'Seleccione su app de impresora en el menú de compartir.');
    } catch (err) {
      console.error('Error en impresión con app:', err);
      mostrarError('Error', err.message || 'No se pudo compartir el comprobante de prueba.');
    } finally {
      setGuardandoPdf(false);
    }
  };

  /**
   * Flujo de impresión directa por Bluetooth con datos de prueba.
   * Mismo proceso que ComprobanteScreen.handleImprimirBluetooth, pero usando
   * createComprobantePrueba() en lugar de los params de la operación real.
   */
  const handleImprimirBluetooth = async () => {
    if (Platform.OS !== 'android') {
      mostrarInfo(
        'No disponible',
        'La impresión por Bluetooth solo está disponible en Android.'
      );
      return;
    }
    setImprimiendoBluetooth(true);
    try {
      await PrintService.verificarBluetooth();
      const lista = await PrintService.buscarDispositivosBluetooth();
      if (!Array.isArray(lista) || lista.length === 0) {
        mostrarInfo(
          'Sin impresoras',
          'No se encontraron impresoras Bluetooth emparejadas. Empareje su impresora desde la configuración del sistema e intente de nuevo.'
        );
        return;
      }
      setDispositivosBluetooth(lista);
      setSelectorVisible(true);
    } catch (err) {
      console.error('Error al iniciar impresión Bluetooth de prueba:', err);
      mostrarError('Error', err?.message || 'No se pudo iniciar la impresión Bluetooth.');
    } finally {
      setImprimiendoBluetooth(false);
    }
  };

  /**
   * Imprime un comprobante de prueba ESC/POS en el dispositivo elegido.
   * La librería @finan-me/react-native-thermal-printer maneja
   * la conexión/desconexión internamente en cada printBluetooth().
   */
  const handleSeleccionarDispositivo = async (device) => {
    const deviceId = device?.address || device?.id || device?.deviceId;
    if (!deviceId) {
      mostrarError('Error', 'El dispositivo seleccionado no tiene una dirección válida.');
      return;
    }
    setDeviceIdEnImpresion(deviceId);
    setImprimiendoBluetooth(true);
    try {
      const comprobantePrueba = createComprobantePrueba();
      await PrintService.imprimirComprobante({
        ...comprobantePrueba,
        deviceId,
      });

      // Guardar selección para futuras impresiones
      await PrintService.guardarUltimaImpresora(deviceId);
      setLastPrinterId(deviceId);

      setSelectorVisible(false);
      mostrarExito(
        'Impresión exitosa',
        'El comprobante de prueba fue enviado a la impresora.'
      );
    } catch (err) {
      console.error('Error al imprimir prueba por Bluetooth:', err);
      mostrarError('Error de impresión', err?.message || 'No se pudo imprimir el comprobante de prueba.');
    } finally {
      setDeviceIdEnImpresion(null);
      setImprimiendoBluetooth(false);
    }
  };

  const handleCerrarSelector = () => {
    if (imprimiendoBluetooth) return;
    setSelectorVisible(false);
    setDispositivosBluetooth([]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#325191', '#38599E']}
        style={styles.gradient}
      >
        <View style={globalStyles.header}>
          <View style={globalStyles.headerContent}>
            <TouchableOpacity
              style={globalStyles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={globalStyles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={globalStyles.headerTitleContainer}>
              <Text style={globalStyles.headerTitle} numberOfLines={1}>
                Probar impresión
              </Text>
            </View>
            <View style={globalStyles.menuButton} />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Impresión con app (PDF)</Text>
            <Text style={styles.description}>
              Genera un comprobante de prueba en PDF y lo abre con el menú compartir del sistema
              para enviarlo a su app de impresión u otro destino.
            </Text>
            <TouchableOpacity
              style={[styles.runButton, ocupado && styles.runButtonDisabled]}
              onPress={() => void handleImpresionConApp()}
              disabled={ocupado}
              activeOpacity={0.8}
            >
              {guardandoPdf ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <View style={styles.runButtonContent}>
                  <MaterialIcons name="share" size={20} color={colors.white} />
                  <Text style={styles.runButtonText}>COMPARTIR PDF</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Impresión por Bluetooth (ESC/POS)</Text>
            <Text style={styles.description}>
              Envía un comprobante de prueba directamente a la impresora térmica vía Bluetooth
              (mismo proceso que en el comprobante real, solo Android).
            </Text>
            <TouchableOpacity
              style={[styles.runButton, styles.runButtonBluetooth, ocupado && styles.runButtonDisabled]}
              onPress={() => void handleImprimirBluetooth()}
              disabled={ocupado}
              activeOpacity={0.8}
            >
              {imprimiendoBluetooth && !selectorVisible ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <View style={styles.runButtonContent}>
                  <MaterialIcons name="print" size={20} color={colors.white} />
                  <Text style={styles.runButtonText}>IMPRIMIR POR BLUETOOTH</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <CustomModal
        visible={modalVisible}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
        buttonText={modalData.buttonText}
        onClose={cerrarModal}
      />

      <BluetoothDeviceSelectorModal
        visible={selectorVisible}
        dispositivos={dispositivosBluetooth}
        imprimiendo={imprimiendoBluetooth}
        deviceIdSeleccionado={deviceIdEnImpresion || lastPrinterId}
        onSelect={handleSeleccionarDispositivo}
        onClose={handleCerrarSelector}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  gradient: {
    flex: 1,
    paddingTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: colors.darkGray,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  runButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  runButtonBluetooth: {
    backgroundColor: '#2B4F8C',
  },
  runButtonDisabled: {
    opacity: 0.6,
  },
  runButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  runButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
});
