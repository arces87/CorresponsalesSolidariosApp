import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Platform, RefreshControl, TouchableOpacity } from 'react-native';
import ApiService from '../services/ApiService';
import { AuthContext } from '../context/AuthContext';

import { useRouter } from 'expo-router';

const HistorialAlertasScreen = () => {
  const router = useRouter();
  const { userData } = useContext(AuthContext);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlertas = async () => {
    setLoading(true);
    try {
      const data = await ApiService.listarAlertas({ usuario: userData?.usuario || '' });
      setAlertas(data.alertas || []);
    } catch (err) {
      setAlertas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlertas();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Text style={styles.tipo}>{item.tipoNombre || 'Tipo desconocido'}</Text>
      <Text style={styles.descripcion}>{item.descripcion}</Text>
      <Text style={styles.fecha}>{item.fecha} {item.hora}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2957a4" />
        <Text style={{ color: '#2957a4', marginTop: 10 }}>Cargando alertas...</Text>
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
            <Text style={styles.headerTitle}>HISTORIAL ALERTAS</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <FlatList
        data={alertas}
        keyExtractor={(item, idx) => item.idAlerta?.toString() || idx.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={<Text style={styles.empty}>No hay alertas registradas.</Text>}
        contentContainerStyle={{ flexGrow: 1 }}
      />
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#2957a4',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#2957a4',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipo: {
    color: '#2957a4',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  descripcion: {
    color: '#222',
    marginBottom: 6,
  },
  fecha: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2957a4',
  },
  empty: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default HistorialAlertasScreen;
