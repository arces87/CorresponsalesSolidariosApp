import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import ApiService from '../services/ApiService';

const AlertasScreen = () => {
  const router = useRouter();
  const { catalogos } = useContext(AuthContext);
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  
  // Cargar tipos de alerta cuando cambien los catálogos
  useEffect(() => {
    console.log('Catalogos en contexto:', catalogos);
    if (catalogos?.tiposAlertas) {
      console.log('Tipos de alerta cargados:', catalogos.tiposAlertas);
      // Establecer el primer tipo de alerta como seleccionado por defecto
      if (catalogos.tiposAlertas.length > 0 && !tipo) {
        setTipo(catalogos.tiposAlertas[0].id);
      }
      setLoadingCatalogos(false);
    } else if (catalogos) {
      // Si catalogos existe pero no tiene tiposAlertas
      console.log('No se encontraron tipos de alerta en los catálogos');
      setLoadingCatalogos(false);
    } else {
      // Si catalogos es null/undefined
      console.log('Aún no se han cargado los catálogos');
    }
  }, [catalogos]);

  // Efecto para verificar el estado de carga
  useEffect(() => {
    console.log('Estado de carga:', { loadingCatalogos, tieneCatalogos: !!catalogos?.tiposAlertas });
  }, [loadingCatalogos, catalogos]);

  const handleRegistrar = async () => {
    if (!tipo || !descripcion.trim()) {
      Alert.alert('Campos requeridos', 'Seleccione tipo de alerta y escriba una descripción.');
      return;
    }
    setLoading(true);
    try {
      await ApiService.crearAlerta({
        idTipo: tipo,
        descripcion,
        usuario: userData?.usuario || '',
      });
      Alert.alert('Éxito', 'Alerta registrada correctamente.');
      setTipo('');
      setDescripcion('');
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo registrar la alerta.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCatalogos) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2957a4" />
        <Text style={{ marginTop: 10 }}>Cargando tipos de alerta...</Text>
      </View>
    );
  }

  if (!catalogos?.tiposAlertas?.length) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>No se pudieron cargar los tipos de alerta</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.replace('/menu')}
        >
          <Text style={styles.retryButtonText}>Volver al menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>{'←'}</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>INGRESAR ALERTA</Text>
          </View>          
          <View style={{ width: 40 }} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tipo de Alerta</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={tipo}
            onValueChange={setTipo}
            style={styles.picker}
            dropdownIconColor="#000"
            dropdownIconRippleColor="#ccc"
          >
            {catalogos.tiposAlertas.map((tipoItem) => (
              <Picker.Item 
                key={tipoItem.id} 
                label={tipoItem.nombre} 
                value={tipoItem.id} 
              />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Descripcion</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Describa la alerta..."
        />
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleRegistrar}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Registrando...' : 'REGISTRAR'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    width: '92%',
    alignSelf: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    flex: 1,
  },   
  container: {
    flex: 1,
    backgroundColor: '#2957a4',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    color: '#2957a4',
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 10,
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
  textInput: {
    borderWidth: 1,
    borderColor: '#2957a4',
    borderRadius: 5,
    padding: 8,
    minHeight: 80,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#2957a4',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AlertasScreen;
