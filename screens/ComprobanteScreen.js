import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useContext, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomModal from '../components/CustomModal';
import { AuthContext } from '../context/AuthContext';
import PrintService from '../services/PrintService';
import { globalStyles } from '../styles/globalStyles';
import { clearOperacionEnCurso } from '../utils/clearOperacionEnCurso';

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
  const { setUserData } = useContext(AuthContext);
  const { monto, comision, total, fecha, labelTransaccion, accionTransaccion, nombreSocio, numeroCuenta, codigoOperacion, observacion, usuario, negocio, identificacionCliente, nombreServicio } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    message: '',
    type: 'info',
  });
  const [guardandoPdf, setGuardandoPdf] = useState(false);
  const [tooltipLabel, setTooltipLabel] = useState(null);
  const tooltipTimeoutRef = useRef(null);

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

  /** Mismo flujo que antes "Impresión con app": generar PDF y compartir (selector del sistema). */
  const handleImprimir = () => {
    void handleGuardarPdf();
  };

  // Mismos criterios que PrintService (ticket térmico): toAsciiTicket + normalizarFechaHora
  const estaticos = PrintService.COMPROBANTE_DATOS_ESTATICOS;
  const tipoAscii =
    PrintService.toAsciiTicket(labelTransaccion).toUpperCase() || 'OPERACION KAYPI';
  const montoStr = `S/ ${(parseFloat(monto) || 0).toFixed(2)}`;
  const fechaHora = PrintService.normalizarFechaHora(fecha);
  const codigoOp = PrintService.toAsciiTicket(codigoOperacion);
  const idSocio = PrintService.toAsciiTicket(identificacionCliente);
  const nombreSocioAscii = PrintService.toAsciiTicket(nombreSocio);
  const cuentaEnmascarada = accionTransaccion === 'retiro' || accionTransaccion === 'deposito'
    ? PrintService.toAsciiTicket(PrintService.enmascararNumeroCuenta(numeroCuenta))
    : numeroCuenta;
  const observacionStr = observacion ? `:${PrintService.toAsciiTicket(observacion)}` : '';
  const nombreServicioStr =
    nombreServicio != null && String(nombreServicio).trim() !== ''
      ? PrintService.toAsciiTicket(String(nombreServicio).trim())
      : '';
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
      `<tr><td colspan="2" style="text-align:center;font-size:11px;">OPERACION REALIZADA EN SU KAYPI</td></tr>`
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
        `<tr><td style="font-weight:bold;">NRO DE CUENTA/CODIGO:</td><td>${escapeHtml(cuentaEnmascarada)}</td></tr>`
      );
    }
    if (nombreServicioStr !== '') {
      rows.push(
        `<tr><td style="font-weight:bold;">SERVICIO:</td><td>${escapeHtml(nombreServicioStr)}</td></tr>`
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
    } catch (err) {
      console.error('Error al generar PDF:', err);
      mostrarModal('Error', err.message || 'No se pudo generar el archivo PDF.', 'error');
    } finally {
      setGuardandoPdf(false);
    }
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
            <Text style={styles.previewOperacion}>OPERACION REALIZADA EN SU KAYPI</Text>
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
                <Text style={styles.previewDetailLabel}>NRO DE CUENTA/CODIGO:</Text>
                <Text style={styles.previewDetailValue}>{cuentaEnmascarada}</Text>
              </View>
            ) : null}
            {nombreServicioStr !== '' ? (
              <View style={styles.previewDetailRow}>
                <Text style={styles.previewDetailLabel}>SERVICIO:</Text>
                <Text style={styles.previewDetailValue} numberOfLines={3}>
                  {nombreServicioStr}
                </Text>
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
                style={[styles.button, styles.buttonIcon, guardandoPdf && styles.buttonDisabled]}
                onPress={handleGuardarPdf}
                onLongPress={() => showTooltip('Compartir')}
                onPressOut={hideTooltip}
                disabled={guardandoPdf}
                accessibilityLabel="Compartir comprobante como PDF"
              >
                {guardandoPdf ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <MaterialIcons name="share" size={28} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonIcon, guardandoPdf && styles.buttonDisabled]}
                onPress={handleImprimir}
                onLongPress={() => showTooltip('Imprimir')}
                onPressOut={hideTooltip}
                disabled={guardandoPdf}
                accessibilityLabel="Imprimir"
              >
                {guardandoPdf ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <MaterialIcons name="print" size={28} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonIcon, guardandoPdf && styles.buttonDisabled]}
                onPress={() => {
                  setUserData((prev) => clearOperacionEnCurso(prev));
                  router.dismissAll();
                  router.replace('/menu');
                }}
                onLongPress={() => showTooltip('Salir')}
                onPressOut={hideTooltip}
                disabled={guardandoPdf}
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
});
