import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomModal from '../components/CustomModal';
import PrintService from '../services/PrintService';
import { globalStyles } from '../styles/globalStyles';

/** Escapa texto para HTML (PDF); usar después de toAsciiTicket en valores dinámicos */
function escapeHtml(text) {
  if (text == null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function ComprobanteScreen() {
  const router = useRouter();
  const { monto, comision, total, referencia, fecha, labelTransaccion, nombreSocio, numeroCuenta, codigoOperacion, observacion, usuario, negocio, identificacionCliente } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [imprimiendo, setImprimiendo] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    message: '',
    type: 'info',
  });
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [dispositivosDisponibles, setDispositivosDisponibles] = useState([]);
  const [comprobanteParaImprimir, setComprobanteParaImprimir] = useState(null);
  const [modalErrorImpresionVisible, setModalErrorImpresionVisible] = useState(false);
  const [guardandoPdf, setGuardandoPdf] = useState(false);
  const [tooltipLabel, setTooltipLabel] = useState(null);
  const tooltipTimeoutRef = useRef(null);
  const seleccionDispositivoRef = useRef(null);

  const showTooltip = (label) => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    setTooltipLabel(label);
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltipLabel(null);
      tooltipTimeoutRef.current = null;
    }, 1500);
  };
  const hideTooltip = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setTooltipLabel(null);
  };

  const mostrarModal = (title, message, type = 'info') => {
    setModalData({ title, message, type });
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
  };

  const handleCancelarSelector = () => {
    setSelectorVisible(false);
    const ref = seleccionDispositivoRef.current;
    if (ref?.resolve) ref.resolve(null);
    seleccionDispositivoRef.current = null;
  };

  const handleImprimir = async () => {
    try {
      setImprimiendo(true);

      try {
        const bluetoothDisponible = await PrintService.verificarBluetooth();
        if (!bluetoothDisponible) {
          mostrarModal(
            'Bluetooth no disponible',
            'Por favor, active Bluetooth en su dispositivo para imprimir el comprobante.',
            'warning'
          );
          setImprimiendo(false);
          return;
        }
      } catch (bluetoothError) {
        mostrarModal(
          'Bluetooth no disponible',
          bluetoothError.message || 'Por favor, active Bluetooth en su dispositivo para imprimir el comprobante.',
          'warning'
        );
        setImprimiendo(false);
        return;
      }

      await new Promise((r) => setTimeout(r, 300));
      const dispositivos = await PrintService.buscarDispositivosBluetooth();
      if (!dispositivos || !Array.isArray(dispositivos)) {
        mostrarModal('Error', 'No se pudo obtener la lista de dispositivos Bluetooth.', 'error');
        setImprimiendo(false);
        return;
      }
      if (dispositivos.length === 0) {
        mostrarModal(
          'Sin dispositivos',
          'No se encontraron dispositivos Bluetooth. Active Bluetooth y empareje la impresora.',
          'warning'
        );
        setImprimiendo(false);
        return;
      }

      setDispositivosDisponibles(dispositivos);
      setSelectorVisible(true);
      const dispositivoSeleccionado = await new Promise((resolve) => {
        seleccionDispositivoRef.current = { resolve };
      });
      setSelectorVisible(false);
      seleccionDispositivoRef.current = null;

      if (!dispositivoSeleccionado) {
        setImprimiendo(false);
        return;
      }

      const deviceId =
        dispositivoSeleccionado.address ||
        dispositivoSeleccionado.Address ||
        dispositivoSeleccionado.id ||
        dispositivoSeleccionado.Id;
      if (!deviceId) {
        mostrarModal('Error', 'No se pudo obtener la dirección del dispositivo seleccionado.', 'error');
        setImprimiendo(false);
        return;
      }

      await new Promise((r) => setTimeout(r, 300));
      try {
        await PrintService.conectarImpresora(deviceId);
      } catch (connectError) {
        try {
          await PrintService.desconectarImpresora();
        } catch (e) {
          console.warn('Al desconectar tras error de conexión:', e);
        }
        throw connectError;
      }

      const comprobante = {
        fecha: fecha || new Date().toLocaleString(),
        referencia: referencia || 'N/A',
        monto: parseFloat(monto) || 0,
        comision: parseFloat(comision) || 0,
        total: parseFloat(total) || 0,
        tipo: labelTransaccion || 'Transacción',
        cliente: nombreSocio || '',
        numeroCuenta: numeroCuenta || '',
        codigoOperacion: codigoOperacion || referencia || 'N/A',
        observacion: observacion || '',
        usuario: usuario || '',
        negocio: negocio || '',
        identificacionCliente: identificacionCliente || '',
        deviceId: null,
      };

      const exito = await PrintService.imprimirComprobante(comprobante);

      if (exito) {
        mostrarModal(
          'Impresión exitosa',
          'El comprobante ha sido enviado exitosamente a la impresora.',
          'success'
        );
        setSelectorVisible(false);
      }
    } catch (error) {
      console.error('Error al imprimir:', error);
      // Ante cualquier error (ej. error al conectar): desconectar y mostrar modal para guardar PDF
      try {
        await PrintService.desconectarImpresora();
      } catch (e) {
        console.warn('Al desconectar tras error:', e);
      }
      setModalErrorImpresionVisible(true);
    } finally {
      setImprimiendo(false);
    }
  };

  const cerrarModalErrorImpresion = () => {
    setModalErrorImpresionVisible(false);
  };

  // Mismos criterios que PrintService (ticket térmico): toAsciiTicket + normalizarFechaHora
  const estaticos = PrintService.COMPROBANTE_DATOS_ESTATICOS;
  const tipoAscii =
    PrintService.toAsciiTicket(labelTransaccion || 'DEPOSITO EN CUENTA').toUpperCase() || 'DEPOSITO EN CUENTA';
  const montoStr = `S/ ${(parseFloat(monto) || 0).toFixed(2)}`;
  const fechaHora = PrintService.normalizarFechaHora(fecha);
  const codigoOp = PrintService.toAsciiTicket(codigoOperacion || referencia || 'N/A');
  const idSocio = PrintService.toAsciiTicket(identificacionCliente);
  const nombreSocioAscii = PrintService.toAsciiTicket(nombreSocio);
  const cuentaEnmascarada = numeroCuenta
    ? PrintService.toAsciiTicket(PrintService.enmascararNumeroCuenta(numeroCuenta))
    : '';
  const observacionStr = observacion ? `:${PrintService.toAsciiTicket(observacion)}` : '';
  const negocioStr = PrintService.toAsciiTicket(negocio);
  const usuarioAscii = PrintService.toAsciiTicket(usuario);
  const nombreEmpresaDisplay = PrintService.toAsciiTicket(estaticos.nombreEmpresa).toUpperCase();
  const rucDisplay = PrintService.toAsciiTicket(estaticos.ruc);
  const atencionDisplay = PrintService.toAsciiTicket(estaticos.atencionAlSocio);

  const buildComprobanteHtml = () => {
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
      `<tr><td colspan="2" style="text-align:center;font-size:11px;">OPERACION REALIZADA EN SU ASESOR VIRTUAL</td></tr>`
    );
    rows.push(`<tr><td colspan="2"><hr/></td></tr>`);
    rows.push(`<tr><td colspan="2" style="text-align:center;font-weight:bold;">${escapeHtml(tipoAscii)}</td></tr>`);
    rows.push(
      `<tr><td colspan="2" style="text-align:center;font-size:16px;font-weight:bold;">${escapeHtml(montoStr)}</td></tr>`
    );
    rows.push(`<tr><td colspan="2"><hr/></td></tr>`);
    rows.push(
      `<tr><td style="font-weight:bold;">FECHA Y HORA:</td><td>${escapeHtml(fechaHora)}</td></tr>`
    );
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
<head><meta charset="utf-8"/><title>Comprobante</title></head>
<body style="font-family:sans-serif;font-size:12px;padding:20px;">
<table width="100%" cellpadding="4" cellspacing="0">${rows.join('')}</table>
</body>
</html>`;
  };

  const handleGuardarPdf = async () => {
    if (Platform.OS === 'web') {
      mostrarModal('No disponible', 'Guardar como PDF no está disponible en la versión web.', 'warning');
      cerrarModalErrorImpresion();
      return;
    }
    setGuardandoPdf(true);
    try {
      const html = buildComprobanteHtml();
      const { uri } = await Print.printToFileAsync({ html, width: 300 });
      const puedeCompartir = await Sharing.isAvailableAsync();
      if (puedeCompartir) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Guardar comprobante como PDF',
        });
        mostrarModal('Comprobante guardado', 'Puede guardar o compartir el archivo PDF desde la opción que eligió.', 'success');
      } else {
        mostrarModal('Comprobante generado', 'El PDF se generó correctamente. Puede abrirlo desde la ubicación del archivo.', 'success');
      }
      cerrarModalErrorImpresion();
    } catch (err) {
      console.error('Error al generar PDF:', err);
      mostrarModal('Error', err.message || 'No se pudo generar el archivo PDF.', 'error');
    } finally {
      setGuardandoPdf(false);
    }
  };

  const handleSeleccionarDispositivo = (dispositivo) => {
    setSelectorVisible(false);
    const ref = seleccionDispositivoRef.current;
    if (ref?.resolve) ref.resolve(dispositivo);
    seleccionDispositivoRef.current = null;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#325191', '#38599E']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoHorizontal}
            resizeMode="contain"
          />
          <View style={styles.statusContainer}>
            <View style={styles.statusIcon}>
              <MaterialIcons name="check" size={20} color="white" />
            </View>
            <Text style={styles.transactionStatus}>Transacción Exitosa</Text>
          </View>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(24, insets.bottom + 24) }]}
          showsVerticalScrollIndicator={true}
        >
        <View style={globalStyles.card}>
          <Text style={styles.previewTitle}>Vista previa del comprobante</Text>
          <View style={styles.comprobantePreview}>
            {nombreEmpresaDisplay ? (
              <Text style={styles.previewInstitucion}>{nombreEmpresaDisplay}</Text>
            ) : null}
            <Text style={styles.previewRegulado}>REGULADO Y SUPERVISADO POR LA S.B.S</Text>
            {rucDisplay ? <Text style={styles.previewRuc}>RUC:{rucDisplay}</Text> : null}
            <Text style={styles.previewOperacion}>OPERACION REALIZADA EN SU ASESOR VIRTUAL</Text>
            <View style={styles.previewSeparator} />
            <Text style={styles.previewTipo}>{tipoAscii}</Text>
            <Text style={styles.previewMonto}>{montoStr}</Text>
            <View style={styles.previewSeparator} />
            <View style={styles.previewDetailRow}>
              <Text style={styles.previewDetailLabel}>FECHA Y HORA:</Text>
              <Text style={styles.previewDetailValue}>{fechaHora}</Text>
            </View>
            {idSocio !== '' ? (
              <View style={styles.previewDetailRow}>
                <Text style={styles.previewDetailLabel}>IDENTIFICACION SOCIO:</Text>
                <Text style={styles.previewDetailValue}>{idSocio}</Text>
              </View>
            ) : null}
            {nombreSocioAscii !== '' ? (
              <View style={styles.previewDetailRow}>
                <Text style={styles.previewDetailLabel}>NOMBRE DEL SOCIO:</Text>
                <Text style={styles.previewDetailValue} numberOfLines={2}>
                  {nombreSocioAscii}
                </Text>
              </View>
            ) : null}
            {cuentaEnmascarada !== '' ? (
              <View style={styles.previewDetailRow}>
                <Text style={styles.previewDetailLabel}>NRO DE CUENTA:</Text>
                <Text style={styles.previewDetailValue}>{cuentaEnmascarada}</Text>
              </View>
            ) : null}
            <View style={styles.previewDetailRow}>
              <Text style={styles.previewDetailLabel}>CODIGO OPERACION:</Text>
              <Text style={styles.previewDetailValue}>{codigoOp}</Text>
            </View>
            {observacionStr !== '' ? (
              <View style={styles.previewDetailRow}>
                <Text style={styles.previewDetailLabel}>OBSERVACION:</Text>
                <Text style={styles.previewDetailValue}>{observacionStr}</Text>
              </View>
            ) : null}
            <View style={styles.previewSeparator} />
            {negocioStr !== '' ? <Text style={styles.previewPie}>NEGOCIO: {negocioStr}</Text> : null}
            {usuarioAscii !== '' ? <Text style={styles.previewPie}>USUARIO: {usuarioAscii}</Text> : null}
            {atencionDisplay ? (
              <Text style={styles.previewPie}>ATENCION AL SOCIO: {atencionDisplay}</Text>
            ) : null}
          </View>

          <View style={styles.buttonsWrapper}>
            {tooltipLabel ? (
              <View style={styles.tooltipBubble}>
                <Text style={styles.tooltipText}>{tooltipLabel}</Text>
              </View>
            ) : null}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonIcon, (guardandoPdf || imprimiendo) && styles.buttonDisabled]}
                onPress={handleGuardarPdf}
                onLongPress={() => showTooltip('Compartir')}
                onPressOut={hideTooltip}
                disabled={guardandoPdf || imprimiendo}
                accessibilityLabel="Compartir comprobante como PDF"
              >
                {guardandoPdf ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <MaterialIcons name="share" size={28} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonIcon, imprimiendo && styles.buttonDisabled]}
                onPress={handleImprimir}
                onLongPress={() => showTooltip('Imprimir')}
                onPressOut={hideTooltip}
                disabled={imprimiendo}
                accessibilityLabel="Imprimir"
              >
                {imprimiendo ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <MaterialIcons name="print" size={28} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonIcon, imprimiendo && styles.buttonDisabled]}
                onPress={() => {
                  router.dismissAll();
                  router.replace('/menu');
                }}
                onLongPress={() => showTooltip('Salir')}
                onPressOut={hideTooltip}
                disabled={imprimiendo}
                accessibilityLabel="Salir al menú"
              >
                <MaterialIcons name="exit-to-app" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </ScrollView>
      </LinearGradient>

      <CustomModal
        visible={modalVisible}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
        onClose={cerrarModal}
      />

      {/* Modal: error de impresión + opción guardar como PDF */}
      <Modal
        visible={modalErrorImpresionVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cerrarModalErrorImpresion}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalErrorImpresionContainer}>
            <LinearGradient
              colors={['#325191', '#2a4580']}
              style={styles.modalErrorImpresionGradient}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            >
              <View style={styles.modalErrorImpresionIcon}>
                <MaterialIcons name="error-outline" size={48} color="#fff" />
              </View>
              <Text style={styles.modalErrorImpresionTitle}>Problema con la impresión</Text>
              <Text style={styles.modalErrorImpresionMessage}>
                Ocurrió un problema con la impresión. ¿Desea guardar el comprobante como archivo?
              </Text>
              <View style={styles.modalErrorImpresionButtons}>
                <TouchableOpacity
                  style={[styles.modalErrorImpresionBtn, styles.modalErrorImpresionBtnNo]}
                  onPress={cerrarModalErrorImpresion}
                  disabled={guardandoPdf}
                >
                  <Text style={styles.modalErrorImpresionBtnTextNo}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalErrorImpresionBtn, styles.modalErrorImpresionBtnSi]}
                  onPress={handleGuardarPdf}
                  disabled={guardandoPdf}
                >
                  {guardandoPdf ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalErrorImpresionBtnTextSi}>Sí</Text>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Modal de selección de dispositivos */}
      <Modal
        visible={selectorVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelarSelector}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#325191', '#2a4580']}
              style={styles.modalGradient}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Impresora</Text>
                <Text style={styles.modalSubtitle}>
                  Se encontraron {dispositivosDisponibles.length} dispositivo(s) disponible(s)
                </Text>
              </View>

              <FlatList
                data={dispositivosDisponibles}
                keyExtractor={(item, index) => item.address || item.id || `device-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.deviceItem}
                    onPress={() => handleSeleccionarDispositivo(item)}
                  >
                    <MaterialIcons name="bluetooth" size={24} color="#2B4F8C" />
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>{item.name || 'Dispositivo sin nombre'}</Text>
                      <Text style={styles.deviceAddress}>{item.address || item.id || 'ID desconocido'}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#666" />
                  </TouchableOpacity>
                )}
                style={styles.deviceList}
              />

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelarSelector}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 16,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 20,
  },
  logoHorizontal: {
    width: width * 0.8,
    maxWidth: 350,
    height: 80,
    marginVertical: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 20,
    justifyContent: 'center',    
  },
  statusIcon: {
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  transactionStatus: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
  },
  previewTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  comprobantePreview: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  previewInstitucion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  previewRuc: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  previewRegulado: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  previewOperacion: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    marginBottom: 12,
  },
  previewSeparator: {
    width: '100%',
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  previewTipo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B4F8C',
    textAlign: 'center',
    marginBottom: 4,
  },
  previewMonto: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2B4F8C',
    textAlign: 'center',
    marginBottom: 4,
  },
  previewDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 6,
  },
  previewDetailLabel: {
    fontSize: 12,
    color: '#666',
    flex: 0,
    marginRight: 8,
  },
  previewDetailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  previewPie: {
    fontSize: 11,
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  buttonsWrapper: {
    width: '100%',
    marginTop: 20,
    position: 'relative',
  },
  tooltipBubble: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    maxWidth: 200,
    alignSelf: 'center',
  },
  tooltipText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    backgroundColor: '#2B4F8C',
    minHeight: 48,
  },
  buttonIcon: {
    minWidth: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  deviceList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 15,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 12,
    color: '#666',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalErrorImpresionContainer: {
    width: width * 0.85,
    maxWidth: 360,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalErrorImpresionGradient: {
    padding: 24,
    alignItems: 'center',
  },
  modalErrorImpresionIcon: {
    marginBottom: 12,
  },
  modalErrorImpresionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalErrorImpresionMessage: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalErrorImpresionButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  modalErrorImpresionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalErrorImpresionBtnNo: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  modalErrorImpresionBtnSi: {
    backgroundColor: '#2BAC6B',
  },
  modalErrorImpresionBtnTextNo: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalErrorImpresionBtnTextSi: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
