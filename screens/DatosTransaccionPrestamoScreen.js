import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import ApiService from '../services/ApiService';
import { globalStyles } from '../styles/globalStyles';

export default function DatosTransaccionPrestamoScreen() {
  const router = useRouter();
  const { checkSessionExpired, setUserData, catalogos, userData, transaccionData } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [tipoId, setTipoId] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [cliente, setCliente] = useState(null);
  const [prestamos, setPrestamos] = useState([]);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [cargandoPrestamos, setCargandoPrestamos] = useState(false);
  const [valorTransaccion, setValorTransaccion] = useState('');
  const [menuLabel, setMenuLabel] = useState('');
  const [menuAccion, setMenuAccion] = useState('');

  const handleContinuar = async () => {
    if (!valorTransaccion) {
      alert('Por favor ingrese un valor para la transacción');
      return;
    }

    try {
      const prestamotransaccion = prestamos.find(c => String(c.secuencial) === prestamoSeleccionado);
      const transaccionData = {
        secuencialprestamo: prestamotransaccion.secuencial,
        codigoprestamo: prestamotransaccion.codigo,
        valor: valorTransaccion,
        nombrecliente: cliente.nombres + ' ' + cliente.apellidos,
        identificacioncliente: cliente.identificacion
      };

      setUserData(prevData => ({
        ...prevData,
        ...transaccionData
      }));

      console.log('Prestamos');
      setLoading(true);
      const saldo = await ApiService.solicitudSaldoCuenta({
        usuario: userData?.usuario        
      });
      console.log('Saldo actual:', saldo);
      if (saldo < Number(valorTransaccion)) {
        alert('El corresponsal no cuenta con suficiente fondos en su cuenta para realizar la transacción.');
        return;
      } 
      const comision = Number(userData?.comisiones?.abonoPrestamos?.administracionCanal) +
        Number(userData?.comisiones?.abonoPrestamos?.agente) +
        Number(userData?.comisiones?.abonoPrestamos?.cooperativa);
      router.push({
        pathname: '/otpverificacion',
        params: {
          monto: valorTransaccion,
          comision: comision,
          total: Number(valorTransaccion) + Number(comision),
          labelTransaccion: menuLabel,
          accionTransaccion: menuAccion,
          otpCliente: userData?.jsonNegocio?.abonoPrestamos?.validarOtpCliente ?? false,
          otpAgente: userData?.jsonNegocio?.abonoPrestamos?.validarOtpAgente ?? false
        }
      });

    } catch (error) {
      console.error('Error en handleContinuar:', error);
      alert(`Error: ${error.message || 'Ocurrió un error al procesar la transacción'}`);
    } finally {
      setLoading(false);
    }
  };

  const [error, setError] = useState('');

  // Establecer el primer tipo de identificación por defecto al cargar los catálogos
  // Cargar la acción del menú seleccionada
  useEffect(() => {
    const loadMenuAction = async () => {
      try {
        const accion = await AsyncStorage.getItem('selectedMenuAccion');
        const label = await AsyncStorage.getItem('selectedMenuLabel');
        if (accion) {
          setMenuAccion(accion);
        }
        if (label) {
          setMenuLabel(label);
        }
      } catch (error) {
        console.error('Error al cargar la acción del menú:', error);
      }
    };

    loadMenuAction();
  }, []);

  useEffect(() => {
    console.log('Catálogos en BuscarClienteScreen:', catalogos);
    if (catalogos?.tiposIdentificaciones?.length > 0) {
      console.log('Tipos de identificación encontrados:', catalogos.tiposIdentificaciones);
      setTipoId(String(catalogos.tiposIdentificaciones[0].secuencial));
    } else {
      console.log('No se encontraron tipos de identificación en los catálogos');
    }
  }, [catalogos]);

  const handleBuscarCliente = async () => {
    if (!identificacion.trim()) {
      Alert.alert('Error', 'Por favor ingrese un número de identificación');
      return;
    }

    if (!tipoId) {
      Alert.alert('Error', 'Por favor seleccione un tipo de identificación');
      return;
    }

    setLoading(true);
    setError('');
    setCliente(null);

    try {
      const resultado = await ApiService.buscarCliente({
        identificacion: identificacion.trim(),
        secuencialTipoIdentificacion: parseInt(tipoId, 10),
        usuario: userData?.usuario        
      });

      setCliente(resultado);
      console.log('Cliente encontrado:', resultado);

      // Buscar prestamos del cliente
      await buscarPrestamosCliente(
        resultado.identificacion,        
        true);
    } catch (error) {
      console.error('Error al buscar cliente:', error);
      setError(error.message || 'Error al buscar el cliente');
      alert('Error', error.message || 'No se pudo encontrar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const buscarPrestamosCliente = async (
    identificacion,
    estaActiva,
  ) => {
    if (!identificacion) return;

    setCargandoPrestamos(true);
    setPrestamos([]);
    setPrestamoSeleccionado('');

    try {
      const resultado = await ApiService.listarPrestamos({
        identificacion,
        estaActiva,
        usuario: userData?.usuario        
      });

      console.log('Prestamos encontrados:', resultado);
      setPrestamos(resultado.informacionPrestamos || []);

      // Seleccionar la primera prestamo por defecto si hay prestamos
      if (resultado.informacionPrestamos?.length > 0) {
        setPrestamoSeleccionado(String(resultado.informacionPrestamos[0].secuencial));
      }
    } catch (error) {
      console.error('Error al buscar prestamos:', error);
      setError('No se pudieron cargar los prestamos del cliente');
    } finally {
      setCargandoPrestamos(false);
    }
  };

  const handleLogout = async () => {
    setUserData(null);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('authToken');
    } catch (e) { }
    router.replace('/');
  };

  useEffect(() => {
    if (checkSessionExpired()) {
      Alert.alert('Sesión expirada', 'Por seguridad, tu sesión ha finalizado.');
      handleLogout();
    }
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2B4F8C', '#2BAC6B']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={[globalStyles.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <View style={globalStyles.headerContent}>
            <TouchableOpacity
              style={globalStyles.backButton}
              onPress={() => router.back()}
            >
              <Text style={globalStyles.backArrow}>‹</Text>
            </TouchableOpacity>
            <View style={globalStyles.headerTitleContainer}>
              <Text style={globalStyles.headerTitle}>{'DATOS ' + menuLabel}</Text>
            </View>
          </View>
        </View>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={true}
        >
        <View style={globalStyles.card}>
          <Text style={styles.instruction}>
            {'Seleccione los datos de la transacción'}
          </Text>
          <Text style={styles.label}>Tipo de Identificación</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tipoId}
              onValueChange={setTipoId}
              style={styles.picker}
              dropdownIconColor="#000"
            >
              {catalogos?.tiposIdentificaciones?.map((tipo) => (
                <Picker.Item
                  key={tipo.secuencial}
                  label={tipo.nombre}
                  value={String(tipo.secuencial)}
                />
              ))}
            </Picker>
          </View>
          <Text style={styles.label}>Identificación:</Text>
          <TextInput
            style={styles.input}
            value={identificacion}
            onChangeText={setIdentificacion}
            placeholder="Ingrese el número de identificación"
            keyboardType="numeric"
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleBuscarCliente}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>BUSCAR CLIENTE</Text>
            )}
          </TouchableOpacity>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {cliente && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Datos del Cliente</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Nombres:</Text>
                <Text style={styles.resultValue}>{cliente.nombres || 'No disponible'}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Apellidos:</Text>
                <Text style={styles.resultValue}>{cliente.apellidos || 'No disponible'}</Text>
              </View>
              {cliente.telefono && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Teléfono:</Text>
                  <Text style={styles.resultValue}>{cliente.telefono}</Text>
                </View>
              )}
              {cliente.correoElectronico && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Correo:</Text>
                  <Text style={styles.resultValue}>{cliente.correoElectronico}</Text>
                </View>
              )}

              {/* Selector de Prestamos */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SELECCIONAR PRESTAMO</Text>
                {cargandoPrestamos ? (
                  <ActivityIndicator size="small" color="#2957a4" style={styles.loadingIndicator} />
                ) : prestamos.length > 0 ? (
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={prestamoSeleccionado}
                      onValueChange={(itemValue) => setPrestamoSeleccionado(itemValue)}
                      style={styles.picker}
                      dropdownIconColor="#2957a4"
                    >
                      {prestamos.map((prestamo) => (
                        <Picker.Item
                          key={prestamo.secuencial}
                          label={`${prestamo.tipo} - (${prestamo.codigo})`}
                          value={String(prestamo.secuencial)}
                        />
                      ))}
                    </Picker>
                  </View>
                ) : (
                  <Text style={styles.noAccountsText}>No se encontraron prestamos</Text>
                )}

                {prestamoSeleccionado && prestamos.length > 0 && (
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountDetailText}>
                      Saldo: ${prestamos.find(c => String(c.secuencial) === prestamoSeleccionado)?.saldo?.toFixed(2) || '0.00'}
                    </Text>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Valor de la transacción</Text>
                      <View style={styles.currencyInputContainer}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <TextInput
                          style={styles.currencyInput}
                          keyboardType="numeric"
                          placeholder="0.00"
                          placeholderTextColor="#999"
                          value={valorTransaccion}
                          onChangeText={(text) => {
                            // Allow only numbers and one decimal point
                            const regex = /^\d*\.?\d{0,2}$/;
                            if (text === '' || regex.test(text)) {
                              setValorTransaccion(text);
                            }
                          }}
                        />
                      </View>

                      <TouchableOpacity
                        style={[styles.continueButton, !valorTransaccion && styles.continueButtonDisabled]}
                        disabled={!valorTransaccion}
                        onPress={() => handleContinuar()}
                      >
                        <Text style={styles.continueButtonText}>CONTINUAR</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headerWrapper: {
    width: '92%',
    alignSelf: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 0,
  },
  instruction: {
    fontSize: 16,
    color: '#2B4F8C',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    color: '#2B4F8C',
    marginTop: 10,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#2B4F8C',
    borderRadius: 0,
    padding: 8,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: 'transparent',
    color: '#2B4F8C',
    width: '100%',
  },
  disabledInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#2B4F8C',
    borderRadius: 0,
    padding: 8,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  disabledText: {
    color: '#2B4F8C',
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2B4F8C',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 25,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#999',
    opacity: 0.7,
  },
  errorText: {
    color: '#ff4444',
    marginTop: 10,
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  resultTitle: {
    fontSize: 16,
    color: '#2B4F8C',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  resultRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  resultLabel: {
    fontWeight: 'bold',
    color: '#495057',
    width: 120,
  },
  resultValue: {
    flex: 1,
    color: '#212529',
  },
  section: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#2B4F8C',
    marginTop: 10,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  loadingIndicator: {
    padding: 10,
  },
  noAccountsText: {
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 10,
  },
  accountDetails: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
  },
  accountDetailText: {
    fontSize: 16,
    color: '#2B4F8C',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginTop: 10,
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B4F8C',
    borderRadius: 5,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#fff',
  },
  currencySymbol: {
    fontSize: 18,
    color: '#2B4F8C',
    marginRight: 5,
    fontWeight: 'bold',
  },
  currencyInput: {
    flex: 1,
    height: '100%',
    fontSize: 18,
    color: '#2B4F8C',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    color: '#2B4F8C',
    marginBottom: 5,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#2B4F8C',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  continueButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#2B4F8C',
    borderRadius: 5,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});
