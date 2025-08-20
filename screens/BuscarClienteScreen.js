import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import ApiService from '../services/ApiService';

export default function BuscarClienteScreen() {
  const router = useRouter();
  const { checkSessionExpired, setUserData, catalogos, userData } = useContext(AuthContext);
  const [tipoId, setTipoId] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [cliente, setCliente] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('');
  const [loading, setLoading] = useState(false);
  const [cargandoCuentas, setCargandoCuentas] = useState(false);
  const [error, setError] = useState('');
  
  // Establecer el primer tipo de identificación por defecto al cargar los catálogos
  useEffect(() => {
    console.log('Catálogos en BuscarClienteScreen:', catalogos);
    if (catalogos?.tiposIdentificaciones?.length > 0) {
      console.log('Tipos de identificación encontrados:', catalogos.tiposIdentificaciones);
      setTipoId(String(catalogos.tiposIdentificaciones[0].id));
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
        secuencialTipoIdentificacion: 1,
        //usuario: userData?.usuario
        usuario: 'CTORRES'
      });
      
      setCliente(resultado);
      console.log('Cliente encontrado:', resultado);
      
      // Buscar cuentas del cliente
      await buscarCuentasCliente(resultado.identificacion, resultado.secuencialTipoIdentificacion);
    } catch (error) {
      console.error('Error al buscar cliente:', error);
      setError(error.message || 'Error al buscar el cliente');
      Alert.alert('Error', error.message || 'No se pudo encontrar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const buscarCuentasCliente = async (identificacion, secuencialTipoIdentificacion) => {
    if (!identificacion || !secuencialTipoIdentificacion) return;
    
    setCargandoCuentas(true);
    setCuentas([]);
    setCuentaSeleccionada('');
    
    try {
      const resultado = await ApiService.buscarCuentas({
        identificacion,
        secuencialTipoIdentificacion,
        usuario: userData?.usuario || 'USUARIO_DEFAULT'
      });
      
      console.log('Cuentas encontradas:', resultado);
      setCuentas(resultado.cuentaDetallesConsolidado || []);
      
      // Seleccionar la primera cuenta por defecto si hay cuentas
      if (resultado.cuentaDetallesConsolidado?.length > 0) {
        setCuentaSeleccionada(String(resultado.cuentaDetallesConsolidado[0].secuencialCuenta));
      }
    } catch (error) {
      console.error('Error al buscar cuentas:', error);
      setError('No se pudieron cargar las cuentas del cliente');
    } finally {
      setCargandoCuentas(false);
    }
  };

  const handleLogout = async () => {
    setUserData(null);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('authToken');
    } catch (e) {}
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
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Text style={styles.backArrow}>{'←'}</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>BUSCAR CLIENTE</Text>
            </View>
          </View>
        </View>
      <View style={styles.card}>
        <Text style={styles.instruction}>Seleccione los datos del cliente</Text>
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
                key={tipo.id} 
                label={tipo.nombre} 
                value={String(tipo.id)} 
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
        <Text style={styles.label}>Institución:</Text>
        <View style={styles.disabledInput}>
          <Text style={styles.disabledText}>LOS ANDES</Text>
        </View>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleBuscarCliente}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>CONSULTAR</Text>
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
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Identificación:</Text>
              <Text style={styles.resultValue}>{cliente.identificacion || 'No disponible'}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Tipo:</Text>
              <Text style={styles.resultValue}>
                {cliente.nombreTipoIdentificacion || `Tipo ${cliente.secuencialTipoIdentificacion}` || 'No disponible'}
              </Text>
            </View>
            {cliente.direccion && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Dirección:</Text>
                <Text style={styles.resultValue}>{cliente.direccion}</Text>
              </View>
            )}
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
            
            {/* Selector de Cuentas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SELECCIONAR CUENTA</Text>
              {cargandoCuentas ? (
                <ActivityIndicator size="small" color="#2957a4" style={styles.loadingIndicator} />
              ) : cuentas.length > 0 ? (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={cuentaSeleccionada}
                    onValueChange={(itemValue) => setCuentaSeleccionada(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#2957a4"
                  >
                    {cuentas.map((cuenta) => (
                      <Picker.Item 
                        key={cuenta.secuencialCuenta} 
                        label={`${cuenta.tipoCuentaNombre} - ${cuenta.monedaNombre} (${cuenta.codigo})`} 
                        value={String(cuenta.secuencialCuenta)} 
                      />
                    ))}
                  </Picker>
                </View>
              ) : (
                <Text style={styles.noAccountsText}>No se encontraron cuentas</Text>
              )}
              
              {cuentaSeleccionada && cuentas.length > 0 && (
                <View style={styles.accountDetails}>
                  <Text style={styles.accountDetailText}>
                    Saldo disponible: ${cuentas.find(c => String(c.secuencialCuenta) === cuentaSeleccionada)?.disponibleParaTransaccion?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
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
  header: {
    width: '100%',
    paddingTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    paddingHorizontal: 20,
  },
  headerTitleContainer: {
    flex: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  backButton: {
    zIndex: 1,
    padding: 10,
    marginLeft: -10,
  },
  backArrow: {
    color: '#fff',
    fontSize: 35,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: '90%',
    maxWidth: 500,
    borderRadius: 12,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
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
    fontSize: 14,
    color: '#212529',
    textAlign: 'center',
    fontWeight: '500',
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
});
