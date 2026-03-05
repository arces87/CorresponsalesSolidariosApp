import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomModal from '../components/CustomModal';
import PrintService from '../services/PrintService';
import { globalStyles } from '../styles/globalStyles';

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

  const mostrarModal = (title, message, type = 'info') => {
    setModalData({ title, message, type });
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
  };

  const handleImprimir = async (deviceIdSeleccionado = null) => {
    try {
      setImprimiendo(true);
      
      // Verificar Bluetooth
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

      // Preparar datos del comprobante (formato según imagen: institución, tipo, monto, detalle, pie)
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
        deviceId: deviceIdSeleccionado,
      };

      // Intentar imprimir
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
      
      // Si hay múltiples dispositivos, mostrar selector
      if (error.codigo === 'MULTIPLES_DISPOSITIVOS' && error.dispositivos) {
        setDispositivosDisponibles(error.dispositivos);
        setComprobanteParaImprimir({
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
        });
        setSelectorVisible(true);
        setImprimiendo(false);
        return;
      }
      
      const mensajeError = error.message || 'No se pudo imprimir el comprobante. Por favor, intente nuevamente.';
      mostrarModal('Error de impresión', mensajeError, 'error');
    } finally {
      setImprimiendo(false);
    }
  };

  const handleSeleccionarDispositivo = (dispositivo) => {
    setSelectorVisible(false);
    const deviceId = dispositivo.address || dispositivo.id;
    handleImprimir(deviceId);
  };

  // Datos estáticos y enmascarado igual que en PrintService (previsualización = lo que se imprime)
  const estaticos = PrintService.COMPROBANTE_DATOS_ESTATICOS;
  const cuentaEnmascarada = numeroCuenta ? PrintService.enmascararNumeroCuenta(numeroCuenta) : '';
  const tipoLabel = (labelTransaccion || 'DEPOSITO EN CUENTA').toUpperCase();
  const montoStr = `S/ ${(parseFloat(monto) || 0).toFixed(2)}`;
  const fechaHora = PrintService.normalizarFechaHora(fecha);
  const codigoOp = codigoOperacion || referencia || 'N/A';
  const observacionStr = observacion ? `:${observacion}` : '';
  const negocioStr = negocio || '';
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2B4F8C', '#2BAC6B']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <Image
            source={require('../assets/logo-horizontal-blanco.png')}
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
            {estaticos.nombreEmpresa ? (
              <Text style={styles.previewInstitucion}>{estaticos.nombreEmpresa}</Text>
            ) : null}            
            <Text style={styles.previewRegulado}>REGULADO Y SUPERVISADO POR LA S.B.S</Text>
            {estaticos.ruc ? <Text style={styles.previewRuc}>RUC:{estaticos.ruc}</Text> : null}
            <Text style={styles.previewOperacion}>Operación realizada en su Asesor Virtual</Text>
            <View style={styles.previewSeparator} />
            <Text style={styles.previewTipo}>{tipoLabel}</Text>
            <Text style={styles.previewMonto}>{montoStr}</Text>
            <View style={styles.previewSeparator} />
            <View style={styles.previewDetailRow}>
              <Text style={styles.previewDetailLabel}>Fecha y Hora:</Text>
              <Text style={styles.previewDetailValue}>{fechaHora}</Text>
            </View>
            {(identificacionCliente != null && String(identificacionCliente).trim() !== '') ? (
              <View style={styles.previewDetailRow}>
                <Text style={styles.previewDetailLabel}>Identificación Socio:</Text>
                <Text style={styles.previewDetailValue}>{identificacionCliente}</Text>
              </View>
            ) : null}
            {(nombreSocio != null && String(nombreSocio).trim() !== '') ? (
              <View style={styles.previewDetailRow}>
                <Text style={styles.previewDetailLabel}>Nombre del Socio:</Text>
                <Text style={styles.previewDetailValue} numberOfLines={2}>{nombreSocio}</Text>
              </View>
            ) : null}
            {(cuentaEnmascarada != null && String(cuentaEnmascarada).trim() !== '') ? (
              <View style={styles.previewDetailRow}>
                <Text style={styles.previewDetailLabel}>N° de Cuenta:</Text>
                <Text style={styles.previewDetailValue}>{cuentaEnmascarada}</Text>
              </View>
            ) : null}
            <View style={styles.previewDetailRow}>
              <Text style={styles.previewDetailLabel}>Código Operación:</Text>
              <Text style={styles.previewDetailValue}>{codigoOp}</Text>
            </View>
            {(observacion != null && String(observacion).trim() !== '') ? (
              <View style={styles.previewDetailRow}>
                <Text style={styles.previewDetailLabel}>Observación:</Text>
                <Text style={styles.previewDetailValue}>{observacionStr}</Text>
              </View>
            ) : null}
            <View style={styles.previewSeparator} />
            {(negocioStr != null && String(negocioStr).trim() !== '') ? (
              <Text style={styles.previewPie}>NEGOCIO: {negocioStr}</Text>
            ) : null}
            {(usuario != null && String(usuario).trim() !== '') ? (
              <Text style={styles.previewPie}>USUARIO: {usuario}</Text>
            ) : null}
            {estaticos.atencionAlSocio ? (
              <Text style={styles.previewPie}>ATENCION AL SOCIO: {estaticos.atencionAlSocio}</Text>
            ) : null}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, imprimiendo && styles.buttonDisabled]}
              onPress={handleImprimir}
              disabled={imprimiendo}
            >
              {imprimiendo ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>IMPRIMIR</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.replace('/menu')}
              disabled={imprimiendo}
            >
              <Text style={styles.buttonText}>SALIR</Text>
            </TouchableOpacity>
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

      {/* Modal de selección de dispositivos */}
      <Modal
        visible={selectorVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#2B4F8C', '#2BAC6B']}
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
                onPress={() => setSelectorVisible(false)}
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
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
});
