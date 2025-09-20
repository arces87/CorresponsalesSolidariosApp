import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import ApiService from '../services/ApiService';

const { width } = Dimensions.get('window');

export default function HojaColectaScreen() {
  const router = useRouter();
  const { userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [fecha, setFecha] = useState(new Date());
  const [resumen, setResumen] = useState({
    totalDepositos: 0,
    totalRetiros: 0,
    totalComisiones: 0,
    saldoCaja: 0
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      console.log('Cargando datos para el usuario:', userData?.usuario);
      // Obtener datos de la API
      const response = await ApiService.obtenerTransaccionesHojaColecta({
        usuario: userData?.usuario        
      });

      const tipos = await ApiService.obtenerTiposTransacciones({
        usuario: userData?.usuario        
      });

            
      // Mapear la respuesta de la API al formato esperado
      const transaccionesMapeadas = response.transacciones?.map((t, index) => ({  
        id: `trans-${index}`,
        tipo: t.tipo || 'Transacción',
        valor: t.valor || 0,
        fecha: t.fechaSistema || new Date().toISOString(),
        cliente: t.nombreCliente || 'Cliente',
        cuenta: t.numeroCuenta || 'Cuenta',
        identificacionCliente: t.identificacionCliente || ''
      })) || [];
      
      // Calcular resumen
      const totalDepositos = tipos.transacciones
        ?.filter(t => t.nombre?.toLowerCase().includes('depósito'))
        .reduce((sum, t) => sum + (t.valor || 0), 0) || 0;
        
      const totalRetiros = tipos.transacciones
        ?.filter(t => t.nombre?.toLowerCase().includes('retiro'))
        .reduce((sum, t) => sum + (t.valor || 0), 0) || 0;
        
      // Calcular comisiones (ajustar según la lógica de negocio)
      const totalComisiones = tipos.transacciones
        ?.filter(t => t.nombre?.toLowerCase().includes('comisión'))
        .reduce((sum, t) => sum + (t.valor || 0), 0) || 0;
        
      setResumen({
        totalDepositos,
        totalRetiros,
        totalComisiones,
        saldoCaja: tipos.saldoCaja
      });
      
      setTransacciones(transaccionesMapeadas);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
      alert('Ocurrió un error al cargar las transacciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
  };

  useEffect(() => {
    cargarDatos();
  }, [fecha]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2B4F8C', '#2BAC6B']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* Header with title */}
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backArrow}>{'←'}</Text>
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>HOJA DE COLECTA</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Main content container */}
        <View style={styles.mainContainer}>
          <ScrollView 
            style={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
          >
            <View style={styles.contentContainer}>
              {/* Sección de Resumen */}
              <View style={styles.summaryCard}>                
                
                <View style={styles.summaryRow}>
                  
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, {fontWeight: 'bold'}]}>Saldo Caja</Text>
                    <Text style={[styles.summaryValue, styles.balanceAmount]}>
                      $ {(resumen?.saldoCaja || 0)}
                    </Text>
                  </View>   

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Depósitos</Text>
                    <Text style={[styles.summaryValue, styles.positiveAmount]}>$ {(resumen?.totalDepositos || 0)}</Text>
                  </View>


                </View>
                
                <View style={[styles.summaryRow, {marginTop: 10}]}>                

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Comisiones</Text>
                    <Text style={[styles.summaryValue, styles.commissionAmount]}>$ {(resumen?.totalComisiones || 0)}</Text>
                  </View>  

                  <View style={styles.summaryDivider} />    

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Retiros</Text>
                    <Text style={[styles.summaryValue, styles.negativeAmount]}>$ {(resumen?.totalRetiros || 0)}</Text>
                  </View>
                </View>

                <View style={[styles.summaryRow, {marginTop: 10}]}>                

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Pago a Terceros</Text>
                    <Text style={[styles.summaryValue, styles.positiveAmount]}>$ {(resumen?.totalComisiones || 0)}</Text>
                  </View>  

                  <View style={styles.summaryDivider} />    

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Abono a préstamos</Text>
                    <Text style={[styles.summaryValue, styles.positiveAmount]}>$ {(resumen?.totalRetiros || 0)}</Text>
                  </View>
                </View>
              </View>
              
              <Text style={styles.transactionsTitle}>TRANSACCIONES</Text>
              {loading ? (
                <ActivityIndicator size="large" color="#2B4F8C" style={styles.loadingIndicator} />
              ) : transacciones.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No hay transacciones para mostrar</Text>
                </View>
              ) : (
                <View style={styles.transactionsContainer}>
                  {transacciones.map((transaccion) => (
                    <View key={transaccion.id} style={styles.transactionCard}>
                      <View style={styles.transactionHeader}>
                        <Text style={styles.transactionType}>{transaccion.tipo}</Text>
                        <Text style={[
                          styles.transactionAmount,
                          { color: transaccion.tipo === 'Depósito' ? '#2BAC6B' : '#E74C3C' }
                        ]}>
                          {transaccion.tipo === 'Depósito' ? '+' : '-'} ${transaccion.monto}
                        </Text>
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={styles.detailText}>{transaccion.cliente}</Text>                        
                        <Text style={styles.detailText}>
                          {new Date(transaccion.fecha).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </LinearGradient>
    </View>
  );
}

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
  mainContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: '90%',
    maxWidth: 500,
    borderRadius: 12,
    padding: 25,    
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
    width: '100%',
    paddingBottom: 15,
  },
  headerWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    paddingTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
  },
  backButton: {
    zIndex: 2,
    padding: 10,
    marginLeft: -10,
  },
  backArrow: {
    color: '#fff',
    fontSize: 35,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    padding: 15,
    paddingTop: 10,
  },
  loadingIndicator: {
    marginTop: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    color: '#2B4F8C',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: '#2BAC6B',
  },
  negativeAmount: {
    color: '#E74C3C',
  },
  commissionAmount: {
    color: '#F39C12',
  },
  balanceAmount: {
    color: '#2B4F8C',
    fontSize: 20,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  transactionsTitle: {
    color: '#2B4F8C',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 5,
  },
  transactionsContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B4F8C',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDetails: {
    marginTop: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
});
