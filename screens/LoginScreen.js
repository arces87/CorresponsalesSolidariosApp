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
  const { setUserData } = useContext(AuthContext);


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
    const imei = await getDeviceId();
    const mac = getGUID(imei);
    setUserData({
      usuario: username,
      contrasenia: password,
      imei,
      mac
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

      /* const username = "CTORRES";
      const password = "2025.Pruebas";
      const imei = "88F33DE43A5D40F4F5C4B86397B96A0B";
      const mac = "9ef8f9b213c8502b"; */

      const response = await ApiService.login({
        usuario: username,
        contrasenia: password,
        imei,
        mac,
        latitud,
        longitud,
      });

      if (response.token) {
        setUserData({
          usuario: username,
          contrasenia: password,
          imei,
          mac,
          token: response.token,
        });
        router.push('/menu');
      } else {
        alert('Credenciales incorrectas o usuario inactivo');
      }
    } catch (error) {
      alert('Error de autenticación: ' + (error.message || error));
    }
  };

  // Función para obtener el DEVICE_ID
  const getDeviceId = async () => {
    try {
      // Usar osInternalBuildId si está disponible, si no, usar deviceName
      const deviceId = Device.osInternalBuildId || Device.deviceName || '';
      return deviceId;
    } catch (error) {
      console.error('Error al obtener el Device ID:', error);
      return '';
    }
  };

  const showDeviceInfo = async () => {
    const imei = await getDeviceId();
    const mac = getGUID(imei);
    alert(`DEVICE_ID: ${imei}\nGUID: ${mac}`);
  };

  // Función para generar un GUID tipo UUID v4 a partir del IMEI
  function getGUID(imei) {
    let hash = 0;
    for (let i = 0; i < imei.length; i++) {
      hash = ((hash << 5) - hash) + imei.charCodeAt(i);
      hash |= 0;
    }
    let hex = Math.abs(hash).toString(16).padStart(12, '0');
    return (
      hex.substring(0, 8) + '-' +
      hex.substring(8, 12) + '-4' +
      hex.substring(12, 15).padEnd(3, '0') + '-a' +
      hex.substring(15, 18).padEnd(3, '0') + '-' +
      hex.substring(18).padEnd(12, '0')
    );
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
