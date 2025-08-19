import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import ApiService from '../services/ApiService';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const CambioContrasenaScreen = () => {
  const router = useRouter();
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [repetirContrasena, setRepetirContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNuevaContrasena, setShowNuevaContrasena] = useState(false);
  const [showRepetirContrasena, setShowRepetirContrasena] = useState(false);

  const handleCambiarContrasena = async () => {
    if (!nuevaContrasena || !repetirContrasena) {
      alert('Por favor complete todos los campos');
      return;
    }

    if (nuevaContrasena !== repetirContrasena) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (nuevaContrasena.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true); 

      const token = await AsyncStorage.getItem('authToken');

      console.log('Token:', token);

      const response = await ApiService.cambiarContrasena({
              token: token,
              contrasenia: nuevaContrasena              
            });
      if(response){
        alert('Contraseña cambiada correctamente');
        router.back();
      }
      else {
        alert('No se pudo cambiar la contraseña. Intente nuevamente.');
      }   
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      alert('No se pudo cambiar la contraseña. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CAMBIO DE CONTRASEÑA</Text>
      </View>
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>Ingrese su nueva contraseña</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={nuevaContrasena}
            onChangeText={setNuevaContrasena}
            placeholder="Nueva contraseña"
            secureTextEntry={!showNuevaContrasena}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setShowNuevaContrasena(!showNuevaContrasena)}
            disabled={loading}
          >
            <Image 
              source={showNuevaContrasena ? 
                require('../assets/eye-off.png') : 
                require('../assets/eye.png')} 
              style={styles.eyeIconImage}
            />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.label, { marginTop: 15 }]}>Repita su contraseña</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={repetirContrasena}
            onChangeText={setRepetirContrasena}
            placeholder="Repetir contraseña"
            secureTextEntry={!showRepetirContrasena}
            autoCapitalize="none"
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleCambiarContrasena}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setShowRepetirContrasena(!showRepetirContrasena)}
            disabled={loading}
          >
            <Image 
              source={showRepetirContrasena ? 
                require('../assets/eye-off.png') : 
                require('../assets/eye.png')} 
              style={styles.eyeIconImage}
            />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCambiarContrasena}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>ACEPTAR</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2957a4',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 30,
  },
  formContainer: {
    padding: 20,
    marginTop: 20,
  },
  label: {
    color: '#333',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  eyeIconImage: {
    width: 24,
    height: 24,
    tintColor: '#666',
  },
  button: {
    backgroundColor: '#2957a4',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CambioContrasenaScreen;
