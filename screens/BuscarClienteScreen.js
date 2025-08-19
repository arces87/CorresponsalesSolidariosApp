import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>{'←'}</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>BUSCAR CLIENTE</Text>
          </View>
          <View style={{width: 40}} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3267b2',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backArrow: {
    color: '#3267b2',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    marginTop: 10,
    width: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 6,
    alignSelf: 'center',
  },
  instruction: {
    color: '#3267b2',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 14,
    textAlign: 'center',
  },
  label: {
    color: '#3267b2',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#bbb',
    fontSize: 16,
    paddingVertical: 6,
    color: '#3267b2',
    marginBottom: 5,
  },
  disabledInput: {
    backgroundColor: '#e2e6f2',
    borderRadius: 3,
    padding: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  disabledText: {
    color: '#7b7b7b',
    fontWeight: 'bold',
    fontSize: 17,
  },
  button: {
    backgroundColor: '#2957a4',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  errorText: {
    color: '#ff4444',
    marginTop: 10,
    textAlign: 'center',
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
    fontWeight: 'bold',
    color: '#2957a4',
    marginBottom: 10,
    textAlign: 'center',
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
    fontWeight: 'bold',
    color: '#2957a4',
    marginBottom: 10,
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
    borderColor: '#2957a4',
    borderRadius: 5,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: '100%',
  },
});
