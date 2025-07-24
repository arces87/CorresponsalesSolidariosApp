import { useRouter } from 'expo-router';
import React, { useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RetiroScreen() {
  const router = useRouter();
  const { checkSessionExpired, setUserData } = useContext(AuthContext);
  const [tipoId, setTipoId] = useState('');
  const [identificacion, setIdentificacion] = useState('');

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
        <Text style={styles.label}>Tipo Identificación:</Text>
        <TextInput
          style={styles.input}
          value={tipoId}
          onChangeText={setTipoId}
          placeholder=""
        />
        <Text style={styles.label}>Identificación:</Text>
        <TextInput
          style={styles.input}
          value={identificacion}
          onChangeText={setIdentificacion}
          placeholder=""
        />
        <Text style={styles.label}>Institución:</Text>
        <View style={styles.disabledInput}>
          <Text style={styles.disabledText}>RIOBAMBA</Text>
        </View>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>CONSULTAR</Text>
        </TouchableOpacity>
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
    backgroundColor: '#3267b2',
    borderRadius: 6,
    paddingVertical: 12,
    marginTop: 22,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
