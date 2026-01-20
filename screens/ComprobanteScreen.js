import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';

export default function ComprobanteScreen() {
  const router = useRouter();
  const { monto, comision, total, referencia, fecha } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2B4F8C', '#2BAC6B']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={styles.headerWrapper}>
          <View style={[globalStyles.header, { paddingTop: Math.max(insets.top, 20) }]}>
            <View style={globalStyles.headerContent}>
              <View style={globalStyles.headerTitleContainer}>
                <Text style={globalStyles.headerTitle}>COMPROBANTE TRANSACCION</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.header}>
            
              <Image
                source={require('../assets/logo-horizontal-blanco.png')}
                style={styles.logoHorizontal}
                resizeMode="contain"
              />
                       
            <View style={styles.statusContainer}>
              <View style={styles.statusIcon}>
                <MaterialIcons name="check" size={20} color="white" />
              </View>
              <Text style={styles.transactionStatus}>Transacción Exitosa</Text>
            </View>
          </View>
        <View style={globalStyles.card}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Detalle</Text>
              <Text style={[styles.tableHeaderText, styles.amountColumn]}>Valor</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fecha Transaccion:</Text>
              <Text style={styles.detailValue}>{fecha}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>N° de Comprobate:</Text>
              <Text style={[styles.detailValue, { fontWeight: 'bold' }]}>{referencia}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Monto</Text>
              <Text style={[styles.detailValue, styles.amountColumn]}>${parseFloat(monto).toFixed(2)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Comisión</Text>
              <Text style={[styles.detailValue, styles.amountColumn]}>${parseFloat(comision).toFixed(2)}</Text>
            </View>

            <View style={styles.tableDivider} />

            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={[styles.totalValue, styles.amountColumn]}>${parseFloat(total).toFixed(2)}</Text>
            </View>
          </View>

          <Text style={styles.note}>
            * Este comprobante es válido como constancia de la transacción realizada.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => console.log('Imprimir')}
            >
              <Text style={styles.buttonText}>IMPRIMIR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.replace('/menu')}
            >
              <Text style={styles.buttonText}>SALIR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const { width } = Dimensions.get('window');

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
  headerWrapper: {
    width: '92%',
    alignSelf: 'center',
    paddingTop: 40,
    paddingBottom: 0
  },
  logoHorizontal: {
    width: width * 0.8,
    maxWidth: 350,
    height: 80,
    marginVertical: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 20,
    justifyContent: 'center',    
  },
  statusIcon: {
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  transactionStatus: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    color: '#666',
    fontSize: 14,
  },
  detailValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 12,
  },
  tableHeaderText: {
    color: '#2B4F8C',
    fontWeight: '600',
    fontSize: 14,
  },
  amountColumn: {
    textAlign: 'right',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tableCell: {
    color: '#333',
    fontSize: 14,
  },
  tableDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  totalRow: {
    marginTop: 8,
  },
  totalLabel: {
    color: '#2B4F8C',
    fontWeight: '600',
    fontSize: 16,
  },
  totalValue: {
    color: '#2B4F8C',
    fontWeight: 'bold',
    fontSize: 16,
  },
  note: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    backgroundColor: '#2B4F8C',
  },  
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
