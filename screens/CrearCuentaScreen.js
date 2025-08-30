import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import ApiService from '../services/ApiService';

export default function CrearCuentaScreen() {
  const router = useRouter();
  const { userData, catalogos } = useContext(AuthContext);
  const [tipoId, setTipoId] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('');
  const [montoApertura, setMontoApertura] = useState('');
  const [cuentasDisponibles, setCuentasDisponibles] = useState([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(false);

  // Buscar tipos de cuentas disponibles para el cliente
  const buscarTipoCuentas = async (secuencialCliente, secuencialEmpresa) => {
    try {
      setCargandoCuentas(true);
      setError('');
      
      const tiposCuenta = await ApiService.buscarTipoCuenta({
        secuencialCliente,
        secuencialEmpresa,
        codigoProductoVista: '1',
        usuario: 'CSENARVAEZPR',
        //usuario: userData?.usuario
      });
      
      console.log('Tipos de cuenta encontrados:', tiposCuenta);
      setCuentasDisponibles(tiposCuenta || []);
      
      // Seleccionar el primer tipo de cuenta por defecto si hay opciones disponibles
      if (tiposCuenta?.length > 0) {
        setTipoCuenta(String(tiposCuenta[0].codigo));
        setMontoApertura(String(tiposCuenta[0].valorApertura || '0'));
      }
      
      return tiposCuenta;
    } catch (error) {
      console.error('Error al buscar tipos de cuenta:', error);
      setError(error.message || 'Error al cargar los tipos de cuenta');
      setCuentasDisponibles([]);
      throw error;
    } finally {
      setCargandoCuentas(false);
    }
  };

  // Cargar tipos de identificación
  useEffect(() => {
    console.log('Catálogos en CrearCuentaScreen:', catalogos);
    if (catalogos?.tiposIdentificaciones?.length > 0) {
      console.log('Tipos de identificación encontrados:', catalogos.tiposIdentificaciones);
      const firstTipoId = String(catalogos.tiposIdentificaciones[0].secuencial);
      console.log('Estableciendo tipoId inicial a:', firstTipoId);
      setTipoId(firstTipoId);
    } else {
      console.log('No se encontraron tipos de identificación en los catálogos');
      setTipoId('');
    }
  }, [catalogos]);

  const handleBuscarCliente = async () => {
      if (!identificacion.trim()) {
        alert('Por favor ingrese un número de identificación');
        return;
      }
  
      if (!tipoId) {
        alert('Por favor seleccione un tipo de identificación');
        return;
      }
  
      setLoading(true);
      setError('');
      setCliente(null);

      console.log('Tipo de identificación seleccionado:', tipoId);
  
      try {
        const resultado = await ApiService.buscarCliente({
          identificacion: identificacion.trim(),
          secuencialTipoIdentificacion: parseInt(tipoId),          
          //usuario: userData?.usuario
          //usuario: 'CTORRES'
          usuario: 'CSENARVAEZPR'
        });
        
        setCliente(resultado);
        console.log('Cliente encontrado:', resultado);
        
        // Buscar tipos de cuentas disponibles
        await buscarTipoCuentas(
          resultado.secuencialCliente,
          resultado.secuencialEmpresa);
      } catch (error) {
        console.error('Error al buscar cliente:', error);
        setError(error.message || 'Error al buscar el cliente');
        alert(error.message || 'No se pudo encontrar el cliente');
      } finally {
        setLoading(false);
      }
    };

  const  handleCrearCuenta = async () => {
    if (!tipoCuenta) {
      alert('Por favor seleccione un tipo de cuenta');
      return;
    }

    if (!cliente?.secuencialCliente) {
      alert('No se encontró la información del cliente');
      return;
    }    

    setLoading(true);
    console.log('Datos para crear cuenta:', {
      tipoCuenta,
      cliente,
      userData
    });
    try {
      const response = await ApiService.crearCuenta({
        codigoTipoCuenta: tipoCuenta,
        secuencialCliente: cliente.secuencialCliente,
        //usuario: userData?.usuario,
        usuario: 'CSENARVAEZPR',        
      });

      console.log('Respuesta de crearCuenta:', response);

      if (response.cuentasCreadas?.length > 0) {
        const cuentaCreada = response.cuentasCreadas[0];
        alert(`Cuenta creada exitosamente\nNúmero: ${cuentaCreada.codigoCuenta}\nTipo: ${cuentaCreada.tipoCuentaNombre}`);
        router.back();
      } else {
        throw new Error('No se pudo crear la cuenta');
      }
    } catch (error) {
      console.error('Error creando cuenta:', error);
      alert(error.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2B4F8C', '#2BAC6B']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>CREAR CUENTA</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo de Identificación *</Text>
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
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Identificación:</Text>
              <TextInput
                style={styles.input}
                value={identificacion}
                onChangeText={setIdentificacion}
                placeholder="Ingrese el número de identificación"
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.searchButton, loading && styles.buttonDisabled]}
              onPress={handleBuscarCliente}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>BUSCAR CLIENTE</Text>
              )}
            </TouchableOpacity>

            {cliente && (
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>
                  {cliente.nombres} {cliente.apellidos}
                </Text>
                <Text style={styles.clientId}>
                  {cliente.identificacion}
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Tipo de Cuenta *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={tipoCuenta}
                      onValueChange={setTipoCuenta}
                      style={styles.picker}
                      dropdownIconColor="#000"
                    >                      
                      {cuentasDisponibles.map((cuenta) => (
                        <Picker.Item
                          key={cuenta.codigo}
                          label={cuenta.nombre}
                          value={String(cuenta.codigo)}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>                

                <TouchableOpacity
                  style={[styles.button, styles.continueButton]}
                  onPress={handleCrearCuenta}
                  disabled={loading || !tipoCuenta}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>CREAR CUENTA</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 10,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 30,
    color: '#fff',
    lineHeight: 30,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#2B4F8C',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#2B4F8C',
    borderRadius: 0,
    padding: 8,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
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
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  searchButton: {
    backgroundColor: '#2B4F8C',
    marginTop: 20,
  },
  continueButton: {
    backgroundColor: '#2B4F8C',
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientInfo: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  clientId: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});
