import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import ApiService from '../services/ApiService';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userError, setUserError] = useState(false);
  const [passError, setPassError] = useState(false);
  const router = useRouter();
  const { setUserData, setCatalogos } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  // Función para guardar el token en AsyncStorage
  const saveAuthToken = async (token) => {
    try {
      await AsyncStorage.setItem('authToken', token);
      console.log('Token guardado en AsyncStorage');
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
      alert('Por favor ingrese usuario y clave.');
      return;
    }
    setUserData({
      usuario: username,
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
      alert('Por favor ingrese usuario y clave.');
      return;
    }

    // Activar estado de carga
    setLoading(true);
    
    try {

      const response = await ApiService.login({
        usuario: 'CTORRES',
        contrasenia: '2025.Pruebas'
        //usuario: username.trim(),
        //contrasenia: password.trim()
      });

      if (!response?.token) {
        throw new Error('No se recibió un token de autenticación válido');
      }

      if(response.cambioContrasenia){
        router.push('/cambiocontrasena');
      }
        // 1. Guardar el token en AsyncStorage
        await saveAuthToken(response.token);

        // 2. Guardar los datos del usuario en el contexto
        const userData = {
          ...response,
          loginTimestamp: Date.now(),
          tokenExp: null,
          usuario: username,
          contrasenia: password
        };

        setUserData(userData);      

        // 3. Obtener catálogos
        try {
          const catalogos = await ApiService.obtenerDistribuidos({
            usuario: 'CTORRES'
            //usuario: username.trim()
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
        router.push('/menu');
    } catch (error) {
      alert(error.message || error);
    }finally {      
      setLoading(false);
    }
  };

  const showDeviceInfo = async () => {
    let imei = '';
    let mac = '';
    try {
      imei = await getDeviceId();
      if (!imei) {
        alert('No se pudo obtener un identificador de dispositivo en este entorno.');
        return;
      }
      mac = getGUID(imei);
    } catch (error) {
      alert('Error al obtener el Device ID: ' + (error.message || error));
      return '';
    }
    alert('DEVICE_ID: ' + imei + '\nGUID: ' + mac);
  };

  // Función para obtener el Device ID
  const getDeviceId = async () => {
    try {
      return Device.osInternalBuildId || Device.deviceName || '';
    } catch (error) {
      return '';
    }
  };

  // Función para generar un GUID tipo hash hexa padded igual que en ApiService
  function getGUID(imei) {
    let hash = 0;
    if (!imei) return '';
    for (let i = 0; i < imei.length; i++) {
      hash = ((hash << 5) - hash) + imei.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#325191', '#2BAC6B']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={styles.topSection}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.loginBox}>
        <Text style={styles.label}>Usuario</Text>
        <TextInput
          style={[styles.input, userError && { borderColor: 'red', borderWidth: 1 }]}
          placeholder=""
          value={username}
          onChangeText={text => { setUsername(text); if (userError && text) setUserError(false); }}
          autoCapitalize="none"
        />

        <Text style={[styles.label, { marginTop: 20 }]}>Ingrese su clave</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1 }, passError && { borderColor: 'red', borderWidth: 1 }]}
            placeholder=""
            value={password}
            onChangeText={text => { setPassword(text); if (passError && text) setPassError(false); }}
            secureTextEntry={!showPassword}
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
          <Text style={styles.loginButtonText}>{loading ? 'Autenticando...' : 'INGRESAR'}</Text>
        </TouchableOpacity>

        <View style={styles.bottomOptions}>
          <TouchableOpacity style={styles.bottomButton} onPress={handleGoToReactivar}>
            <Text style={styles.bottomText}>REACTIVAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton} onPress={showDeviceInfo}>
            <Text style={styles.bottomText}>DEVICE ID</Text>
          </TouchableOpacity>
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
    paddingTop: 40,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  loginBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 30,
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
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  bottomText: {
    color: '#2B4F8C',
    fontWeight: '600',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
