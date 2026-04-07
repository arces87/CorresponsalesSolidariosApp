import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import ApiService from '../services/ApiService';

const HistorialAlertasScreen = () => {
  const { userData } = useContext(AuthContext);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlertas = async () => {
    setLoading(true);
    try {
      const data = await ApiService.listarAlertas({         
        usuario: userData?.usuario
      });
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

  /** API listarAlertas: nombreEstado, idEstado */
  const textoEstado = (item) => {
    const nombre = item?.nombreEstado;
    if (nombre != null && String(nombre).trim() !== '') return String(nombre);
    const id = item?.idEstado;
    if (id != null && String(id).trim() !== '') return String(id);
    return '—';
  };

  /** API: comentario (string) */
  const textoComentario = (item) => {
    const v = item?.comentario;
    if (v != null && String(v).trim() !== '') return String(v);
    return '—';
  };

  /** Día/mes/año desde `fecha`; hora desde el campo `hora` (texto del API). */
  const textoFechaHora = (item) => {
    let parteFecha = '';
    if (item?.fecha) {
      try {
        const d = new Date(item.fecha);
        parteFecha = isNaN(d.getTime())
          ? String(item.fecha)
          : d.toLocaleDateString('es-EC', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
      } catch {
        parteFecha = String(item.fecha);
      }
    }
    const h = item?.hora != null ? String(item.hora).trim() : '';
    if (parteFecha && h) return `${parteFecha} ${h}`;
    if (parteFecha) return parteFecha;
    if (h) return h;
    return '—';
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Text style={styles.tipo}>{item.nombreTipo || item.idTipo || 'Tipo desconocido'}</Text>
      <Text style={styles.descripcion}>{item.descripcion ?? ''}</Text>
      <View style={styles.rowMeta}>
        <Text style={styles.metaLabel}>Estado</Text>
        <Text style={styles.metaValue}>{textoEstado(item)}</Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.metaLabel}>Comentarios</Text>
        <Text style={styles.comentarios}>{textoComentario(item)}</Text>
      </View>
      <Text style={styles.fecha}>{textoFechaHora(item)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Cargando alertas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <FlatList
          data={alertas}
          keyExtractor={(item, idx) => (item.id != null ? String(item.id) : idx.toString())}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#2B4F8C']}
              tintColor="#fff"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay alertas registradas</Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  card: {
    flex: 1,
    width: '95%',
    maxWidth: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  listContainer: {
    padding: 10,
    width: '100%',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2B4F8C',
    alignSelf: 'center',
  },
  tipo: {
    color: '#2B4F8C',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  descripcion: {
    color: '#444',
    fontSize: 14,
    marginBottom: 8,
  },
  rowMeta: {
    marginBottom: 8,
  },
  metaLabel: {
    color: '#2B4F8C',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaValue: {
    color: '#333',
    fontSize: 14,
  },
  comentarios: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
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
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#2B4F8C',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default HistorialAlertasScreen;
