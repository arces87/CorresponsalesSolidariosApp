import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
// Si descomenta el bloque de nombre de empresa / versión, agregue useEffect al import:
// import React, { useContext, useEffect, useState } from 'react';
import { Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomModal from '../components/CustomModal';
import { AuthContext } from '../context/AuthContext';
import { useCustomModal } from '../hooks/useCustomModal';
import ApiService from '../services/ApiService';

/** Mismas claves que DEVICE_MAC_STORAGE_KEY / DEVICE_IMEI_STORAGE_KEY en ApiService. */
const APP_DEVICE_CLIENT_MAC_KEY = 'appDeviceClientMacGuid';
const APP_DEVICE_CLIENT_IMEI_KEY = 'appDeviceClientImei';

const LEGACY_DEVICE_MAC_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getGUID(mac) {
  let hash = 0;
  if (!mac) return '';
  for (let i = 0; i < mac.length; i++) {
    hash = ((hash << 5) - hash) + mac.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

function generateDeviceMacUuid() {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  return getGUID(seed);
}

/**
 * Genera o recupera MAC + IMEI, los persiste en AsyncStorage y actualiza caché de ApiService.
 */
async function ensureDeviceMacAndImeiInStorage() {
  let macVal = await AsyncStorage.getItem(APP_DEVICE_CLIENT_MAC_KEY);
  macVal = macVal ? String(macVal).trim() : '';
  let imeiVal = await AsyncStorage.getItem(APP_DEVICE_CLIENT_IMEI_KEY);
  imeiVal = imeiVal ? String(imeiVal).trim() : '';

  if (macVal && LEGACY_DEVICE_MAC_UUID_RE.test(macVal)) {
    macVal = getGUID(macVal);
    imeiVal = getGUID(macVal);
    await AsyncStorage.multiSet([
      [APP_DEVICE_CLIENT_MAC_KEY, macVal],
      [APP_DEVICE_CLIENT_IMEI_KEY, imeiVal],
    ]);
  } else if (!macVal) {
    macVal = generateDeviceMacUuid();
    imeiVal = getGUID(macVal);
    await AsyncStorage.multiSet([
      [APP_DEVICE_CLIENT_MAC_KEY, macVal],
      [APP_DEVICE_CLIENT_IMEI_KEY, imeiVal],
    ]);
  } else if (!imeiVal || imeiVal !== getGUID(macVal)) {
    imeiVal = getGUID(macVal);
    await AsyncStorage.setItem(APP_DEVICE_CLIENT_IMEI_KEY, imeiVal);
  }

  ApiService.clearDeviceClientMacCache();
  await ApiService.getMacImeiForRequest();
  return { mac: macVal, imei: imeiVal };
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userError, setUserError] = useState(false);
  const [passError, setPassError] = useState(false);
  const router = useRouter();
  const { setUserData, setCatalogos } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  // const [nombreEmpresa, setNombreEmpresa] = useState('');
  const { modalVisible, modalData, mostrarAdvertencia, mostrarError, mostrarInfo, mostrarExito, cerrarModal } = useCustomModal();

  // Función para guardar el token en AsyncStorage
  const saveAuthToken = async (token,username) => {
    try {
      await AsyncStorage.setItem('authToken', token);
      console.log('Token guardado en AsyncStorage');
      await AsyncStorage.setItem('userUsuario', username.toUpperCase());
    } catch (error) {
      console.error('Error al guardar el token:', error);
    }
  };


  // Función para ir a Reactivar y guardar datos en contexto
  const handleGoToReactivar = async () => {
    let hasError = false;
    if (!username.trim()) {
      setUserError(true);
      hasError = true;
    } else {
      setUserError(false);
    }
    if (!password.trim()) {
      setPassError(true);
      hasError = true;
    } else {
      setPassError(false);
    }
    if (hasError) {
      mostrarAdvertencia('Campos requeridos', 'Por favor ingrese usuario y clave.');
      return;
    }
    setUserData({
      usuario: (username || '').trim().toUpperCase(),
      contrasenia: password
    });
    router.push('/reactivar');
  };


  // Función para manejar el login
  const handleLogin = async () => {
    // Validar campos
    const hasUserError = !username.trim();
    const hasPassError = !password.trim();
    
    setUserError(hasUserError);
    setPassError(hasPassError);
    
    if (hasUserError || hasPassError) {
      mostrarAdvertencia('Campos requeridos', 'Por favor ingrese usuario y clave.');
      return;
    }

    // Activar estado de carga
    setLoading(true);
    
    try {

      const response = await ApiService.login({ 
        usuario: (username || '').trim().toUpperCase(),
        contrasenia: password.trim()
      });

      if (!response?.token) {
        throw new Error('No se recibió un token de autenticación válido');
      }

      console.log('Login exitoso:', response);    
      console.log('Cambio de contraseña:', response.cambioContrasenia);

      if(response.cambioContrasenia){
        router.push('/cambiocontrasena');
        return;
      }
      
      // 1. Guardar el token en AsyncStorage
      await saveAuthToken(response.token,username);
      

      // 2. Guardar los datos del usuario en el contexto
      const userData = {
        ...response,
        loginTimestamp: Date.now(),
        tokenExp: null,
        usuario: (username || '').trim().toUpperCase(),
        contrasenia: password,
        tiempootp: response.tiempoOtp  
      };

        setUserData(userData);      
        console.log('response', response);  
        // 3. Obtener catálogos
        try {
          const catalogos = await ApiService.obtenerDistribuidos({            
            usuario: (username || '').trim().toUpperCase()
          });

          if (catalogos) {
            setCatalogos(catalogos);
          }
        } catch (error) {
          console.error('Error cargando catálogos:', error);
          // Continuar con el login aunque falle la carga de catálogos
        setUserData(prev => ({
          ...prev,
          catalogos: null
        }));
        }
        console.log('userData', userData);  
        router.push('/menu');
    } catch (error) {
      mostrarError('Error de autenticación', error.message || error);
    }finally {      
      setLoading(false);
    }
  };

  /** Genera/recupera MAC e IMEI en AsyncStorage (único lugar de creación) y muestra el modal. */
  const showDeviceInfo = async () => {
    try {
      const { mac, imei } = await ensureDeviceMacAndImeiInStorage();
      mostrarInfo(
        'Device ID',
        `MAC (AndroidID): ${mac}\n\nIMEI (GUID): ${imei}`
      );
    } catch (error) {
      mostrarError('Error', 'Error al obtener el Device ID: ' + (error.message || error));
    }
  };

  const resetUUID = async () => {
    try {
      ApiService.clearDeviceClientMacCache();
      await AsyncStorage.multiRemove([APP_DEVICE_CLIENT_MAC_KEY, APP_DEVICE_CLIENT_IMEI_KEY]);
      await ApiService.clearSession();
      setUserData(null);
      setCatalogos(null);
      mostrarExito(
        'UUID y sesión reiniciados',
        'Se cerró la sesión y se borró el identificador guardado. Pulse DEVICE ID para generar uno nuevo antes de operar. Ingrese usuario y clave para continuar.'
      );
    } catch (error) {
      mostrarError('Error', error.message || String(error));
    }
  };

  /*
  useEffect(() => {
    const obtenerNombreEmpresa = async () => {
      try {
        const response = await ApiService.devuelveNombreEmpresa({
          secuencial: 1
        });
        if (response?.nombreEmpresa) {
          setNombreEmpresa(response.nombreEmpresa);
        }
      } catch (error) {
        console.error('Error al obtener nombre de empresa:', error);
      }
    };
    obtenerNombreEmpresa();
  }, []);
  */

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#325191', '#38599E']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={20}>
          <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: Math.max(24, insets.bottom + 24) }]} keyboardShouldPersistTaps="handled">
            <View style={styles.topSection}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.loginBox}>
        <Text style={styles.label} allowFontScaling={false}>Usuario</Text>
        <TextInput
          style={[styles.input, userError && { borderColor: 'red', borderWidth: 1 }]}
          placeholder=""
          value={username}
          onChangeText={text => { setUsername((text || '').toUpperCase()); if (userError && text) setUserError(false); }}
          autoCapitalize="characters"
          allowFontScaling={false}
        />

        <Text style={[styles.label, { marginTop: 20 }]} allowFontScaling={false}>Ingrese su clave</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1 }, passError && { borderColor: 'red', borderWidth: 1 }]}
            placeholder=""
            value={password}
            onChangeText={text => { setPassword(text); if (passError && text) setPassError(false); }}
            secureTextEntry={!showPassword}
            allowFontScaling={false}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            <Image 
              source={showPassword ? 
                require('../assets/eye-off.png') : 
                require('../assets/eye.png')} 
              style={styles.eyeIconImage}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText} allowFontScaling={false}>{loading ? 'Autenticando...' : 'INGRESAR'}</Text>
        </TouchableOpacity>

        <View style={styles.bottomOptions}>
          <TouchableOpacity style={styles.bottomButton} onPress={handleGoToReactivar}>
            <Text style={styles.bottomText} allowFontScaling={false}>REACTIVAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton} onPress={showDeviceInfo}>
            <Text style={styles.bottomText} allowFontScaling={false}>DEVICE ID</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton} onPress={resetUUID} disabled={loading}>
            <Text style={styles.bottomText} allowFontScaling={false}>RESET UUID</Text>
          </TouchableOpacity>
        </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        {/*
        <View style={[styles.bottomInfoContainer, { bottom: Math.max(20, insets.bottom + 12) }]}>
          {nombreEmpresa ? (
            <View style={styles.empresaContainer}>
              <Text style={styles.empresaText} allowFontScaling={false}>{nombreEmpresa}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.versionContainer}
            onPress={() => router.push('/probarimpresion')}
            activeOpacity={0.7}
          >
            <Text style={styles.versionText} allowFontScaling={false}>Versión Test Print</Text>
          </TouchableOpacity>
        </View>
        */}
      </LinearGradient>
      <CustomModal
        visible={modalVisible}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
        buttonText={modalData.buttonText}
        onClose={cerrarModal}
      />
    </SafeAreaView>
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
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 360,
    height: 120,
  },
  loginBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: '100%',
    maxWidth: 560,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  label: {
    color: '#2B4F8C',
    fontWeight: 'bold',
    fontSize: 16,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#2B4F8C',
    width: '100%',
    fontSize: 16,
    paddingVertical: 8,
    marginBottom: 15,
    color: '#2B4F8C',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#bbb',
    marginBottom: 20,
    paddingBottom: 30,
  },
  eyeIcon: {
    fontSize: 20,
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: '#2B4F8C',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  bottomOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 30,
    paddingHorizontal: 10,
    flexWrap: 'wrap',
  },
  bottomButton: {
    minWidth: 100,
    alignItems: 'center',
    paddingVertical: 5,
  },
  bottomText: {
    color: '#2B4F8C',
    fontWeight: '600',
    fontSize: 12,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  /*
  bottomInfoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  empresaContainer: {
    marginBottom: 8,
  },
  empresaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  versionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  versionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
  */
});
