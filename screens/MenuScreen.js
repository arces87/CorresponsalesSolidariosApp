import { useRouter } from 'expo-router';
import React, { useContext, useEffect } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

const menuItems = [
  { label: 'RETIRO', icon: require('../assets/ico-retiro.png'), route: '/retiro' },
  { label: 'DEPÓSITO', icon: require('../assets/ico-deposito.png'), route: '' },
  { label: 'PAGO DE PRÉSTAMOS', icon: require('../assets/ico-prestamo.png'), route: '' },
  { label: 'PAGO A TERCEROS', icon: require('../assets/ico-terceros.png'), route: '' },
  { label: 'CUENTAS', icon: require('../assets/ico-cuentas.png'), route: '' },
  { label: 'CLIENTES', icon: require('../assets/ico-clientes.png'), route: '' },
  { label: 'ALERTAS', icon: require('../assets/ico-alertas.png'), route: '/alertastab' },
  { label: 'HOJA DE COLECTA', icon: require('../assets/ico-colecta.png'), route: '' },
  { label: 'HISTORIAL', icon: require('../assets/ico-historial.png'), route: '' },
  { label: 'CERRAR SESIÓN', icon: null, route: '/' },
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
      <View style={styles.header}>
        <Image source={require('../assets/logo-horizontal-blanco.png')} style={styles.logoHorizontal} resizeMode="contain" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e7eaf6',
  },
  header: {
    backgroundColor: '#3267b2',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  logo: {
    width: 55,
    height: 55,
    marginRight: 10,
  },
  logoHorizontal: {
    width: 300,
    height: 90,
    marginBottom: 10,
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    lineHeight: 24,
  },
  menuContainer: {
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  menuButton: {
    backgroundColor: '#3267b2',
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
    borderRadius: 8,
    paddingVertical: 18,
    paddingHorizontal: 0,
    minWidth: 100,
    minHeight: 90,
    justifyContent: 'center',
    elevation: 2,
  },
  menuIcon: {
    width: 32,
    height: 32,
    marginBottom: 8,
    tintColor: '#fff',
  },
  menuLabel: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
});
