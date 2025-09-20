import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

const menuItems = [
  { label: 'RETIRO', icon: require('../assets/ico-retiro.png'), route: '/datostransaccion', accion: 'retiro' },
  { label: 'DEPÓSITO', icon: require('../assets/ico-deposito.png'), route: '/datostransaccion', accion: 'deposito' },
  { label: 'PAGO DE PRÉSTAMOS', icon: require('../assets/ico-prestamo.png'), route: '/datostransaccionprestamo', accion: 'prestamo' },
  { label: 'PAGO A TERCEROS', icon: require('../assets/ico-terceros.png'), route: '', accion: 'pago' },
  { label: 'CUENTAS', icon: require('../assets/ico-cuentas.png'), route: '/crearcuenta', accion: 'cuenta' },
  { label: 'CLIENTES', icon: require('../assets/ico-clientes.png'), route: '/crearcliente', accion: 'cliente' },
  { label: 'ALERTAS', icon: require('../assets/ico-alertas.png'), route: '/alertastab', accion: 'alerta' },
  { label: 'HOJA DE COLECTA', icon: require('../assets/ico-colecta.png'), route: '/hojacolecta', accion: 'colecta' },
  { label: 'HISTORIAL', icon: require('../assets/ico-historial.png'), route: '/historialtransacciones', accion: 'historial' },  
  { label: 'CERRAR SESIÓN', icon: require('../assets/ico-cerrar.png'), route: '/', accion: 'cerrar' },
];

export default function MenuScreen() {
  const router = useRouter();
  const { checkSessionExpired, setUserData } = useContext(AuthContext);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Escalas simples basadas en un diseño guía ~375x812
  const hScale = width / 375;
  const vScale = height / 812;
  const mScale = (size) => Math.round(size * Math.min(1.15, Math.max(0.9, hScale)));
  const itemMinHeight = Math.max(100, Math.round(height * 0.12));
  const logoWidth = Math.min(Math.round(width * 0.8), 350);
  const iconSize = Math.round(36 * Math.min(1.2, Math.max(0.9, hScale)));

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

  const handleMenuItemPress = async (menuItem) => {
    if (menuItem.route === '/') {
      handleLogout();
    } else {
      // Guardar la acción seleccionada en AsyncStorage
      try {
        await AsyncStorage.setItem('selectedMenuLabel', menuItem.label); 
        await AsyncStorage.setItem('selectedMenuAccion', menuItem.accion);       
        if (menuItem.route) {
          router.push(menuItem.route);
        } else {
          Alert.alert('Próximamente', 'Esta funcionalidad estará disponible próximamente');
        }
      } catch (error) {
        console.error('Error al guardar la acción del menú:', error);
        // Continuar con la navegación a pesar del error
        if (menuItem.route) {
          router.push(menuItem.route);
        } else {
          Alert.alert('Próximamente', 'Esta funcionalidad estará disponible próximamente');
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#2B4F8C', '#2BAC6B']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <Image 
            source={require('../assets/logo-horizontal-blanco.png')} 
            style={[styles.logoHorizontal, { width: logoWidth }]}
            resizeMode="contain" 
          />
        </View>
        <ScrollView contentContainerStyle={[
          styles.menuContainer,
          { paddingBottom: insets.bottom + 16, paddingHorizontal: Math.round(12 * hScale) }
        ]}>
        {[0,2,4,6,8].map((rowIdx) => (
          <View key={rowIdx} style={styles.menuRow}>
            <TouchableOpacity style={[styles.menuButton, { minHeight: itemMinHeight, paddingVertical: Math.round(15 * vScale) }]} onPress={() => handleMenuItemPress(menuItems[rowIdx])}>
              <Image source={menuItems[rowIdx].icon} style={[styles.menuIcon, { width: iconSize, height: iconSize }]} />
              <Text style={[styles.menuLabel, { fontSize: mScale(14) }]}>{menuItems[rowIdx].label}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuButton, { minHeight: itemMinHeight, paddingVertical: Math.round(15 * vScale) }]}
              onPress={() => handleMenuItemPress(menuItems[rowIdx+1])}
            >
              {menuItems[rowIdx+1].icon && (
                <Image source={menuItems[rowIdx+1].icon} style={[styles.menuIcon, { width: iconSize, height: iconSize }]} />
              )}
              <Text style={[styles.menuLabel, { fontSize: mScale(14) }]}>{menuItems[rowIdx+1].label}</Text>
            </TouchableOpacity>
          </View>
        ))}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
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
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 10,
  },
  logo: {
    width: 55,
    height: 55,
    marginRight: 10,
  },
  logoHorizontal: {
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
