import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    
    try {

      const response = await ApiService.login({
        usuario: 'CTORRES',
        contrasenia: '2025.Pruebas'
      });

      if (response.token) {
        // 1. Guardar el token en AsyncStorage
        console.log('Guardando token de autenticación...');
        await saveAuthToken(response.token);
        
        // 2. Guardar los datos del usuario en el contexto
        const userData = {
          ...response,
          loginTimestamp: Date.now(),
          tokenExp: null,
          usuario: username,
          contrasenia: password
        };
        
        console.log('Guardando datos de usuario en el contexto...');
        setUserData(userData);
        
        // 3. Obtener catálogos
        try {
          console.log('Iniciando carga de catálogos...');          

          const catalogos = await ApiService.obtenerDistribuidos({
            usuario: 'CTORRES'
          });
          
          console.log('Catálogos obtenidos:', catalogos ? 'Sí' : 'No');
          if (catalogos) {
            console.log('Tipos de alerta recibidos:', catalogos.tiposAlertas?.length || 0);
            console.log('Guardando catálogos en el contexto...');
            setCatalogos(catalogos);
          }
          
        } catch (error) {
          console.error('Error cargando catálogos:', error);
          console.log('Continuando sin catálogos...');
          // Continuar con el login aunque falle la carga de catálogos
          setUserData({
            ...response,
            loginTimestamp: Date.now(),
            tokenExp: null,
            catalogos: null,
            usuario: username,
            contrasenia: password
          });
        }        
        console.log('Navegando al menú...');
        router.replace('/menu');
      } else {
        alert('Credenciales incorrectas o usuario inactivo');
      }
    } catch (error) {
      alert('Error de autenticación: ' + (error.message || error));
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
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
          
        </View>        

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>INGRESAR</Text>
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
  topSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  loginBox: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    color: '#3267b2',
    fontWeight: 'bold',
    fontSize: 18,
    alignSelf: 'flex-start',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#bbb',
    width: '100%',
    fontSize: 16,
    paddingVertical: 8,
    marginBottom: 5,
    color: '#3267b2',
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
    backgroundColor: '#3267b2',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  bottomOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 30,
  },
  bottomText: {
    color: '#3267b2',
    fontWeight: '600',
    marginHorizontal: 10,
  },
});
