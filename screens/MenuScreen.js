import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

const menuItems = [
  { label: 'RETIRO', icon: require('../assets/ico-retiro.png'), route: '/buscarcliente' },
  { label: 'DEPÓSITO', icon: require('../assets/ico-deposito.png'), route: '' },
  { label: 'PAGO DE PRÉSTAMOS', icon: require('../assets/ico-prestamo.png'), route: '' },
  { label: 'PAGO A TERCEROS', icon: require('../assets/ico-terceros.png'), route: '' },
  { label: 'CUENTAS', icon: require('../assets/ico-cuentas.png'), route: '' },
  { label: 'CLIENTES', icon: require('../assets/ico-clientes.png'), route: '' },
  { label: 'ALERTAS', icon: require('../assets/ico-alertas.png'), route: '/alertastab' },
  { label: 'HOJA DE COLECTA', icon: require('../assets/ico-colecta.png'), route: '' },
  { label: 'HISTORIAL', icon: require('../assets/ico-historial.png'), route: '' },  
  { label: 'CERRAR SESIÓN', icon: require('../assets/ico-cerrar.png'), route: '/' },
];
export default function MenuScreen() {
  const router = useRouter();
  const { checkSessionExpired, setUserData } = useContext(AuthContext);

  const handleLogout = async () => {
    setUserData(null);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('authToken');
    } catch (e) {}
    router.replace('/');
  }

  useEffect(() => {
    if (checkSessionExpired()) {
      Alert.alert('Sesión expirada', 'Por seguridad, tu sesión ha finalizado.');
      handleLogout();
    }
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2B4F8C', '#2BAC6B']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={styles.header}>
          <Image 
            source={require('../assets/logo-horizontal-blanco.png')} 
            style={styles.logoHorizontal} 
            resizeMode="contain" 
          />
        </View>
        <ScrollView contentContainerStyle={styles.menuContainer}>
        {[0,2,4,6,8].map((rowIdx) => (
          <View key={rowIdx} style={styles.menuRow}>
            <TouchableOpacity style={styles.menuButton} onPress={() => menuItems[rowIdx].route && router.push(menuItems[rowIdx].route)}>
              <Image source={menuItems[rowIdx].icon} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{menuItems[rowIdx].label}</Text>
            </TouchableOpacity>
            <TouchableOpacity
  style={styles.menuButton}
  onPress={() => {
    if (menuItems[rowIdx+1].label === 'CERRAR SESIÓN') {
      handleLogout();
    } else if (menuItems[rowIdx+1].route) {
      router.push(menuItems[rowIdx+1].route);
    }
  }}
>
  {menuItems[rowIdx+1].icon && (
    <Image source={menuItems[rowIdx+1].icon} style={styles.menuIcon} />
  )}
  <Text style={styles.menuLabel}>{menuItems[rowIdx+1].label}</Text>
</TouchableOpacity>
          </View>
        ))}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    paddingTop: 20,
    alignItems: 'center',
    paddingBottom: 10,
  },
  logo: {
    width: 55,
    height: 55,
    marginRight: 10,
  },
  logoHorizontal: {
    width: width * 0.8,
    maxWidth: 350,
    height: 80,
    marginVertical: 10,
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    lineHeight: 24,
  },
  menuContainer: {
    padding: 10,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    width: '100%',
    maxWidth: 450,
  },
  menuButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
    borderRadius: 12,
    paddingVertical: 15,
    minHeight: 100,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    width: 36,
    height: 36,
    marginBottom: 10,
    tintColor: '#2B4F8C',
  },
  menuLabel: {
    color: '#2B4F8C',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
    paddingHorizontal: 5,
  },
});
