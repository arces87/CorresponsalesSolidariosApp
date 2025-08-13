import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import AlertasScreen from './AlertasScreen';
import HistorialAlertasScreen from './HistorialAlertasScreen';

const TABS = [
  { key: 'ingresar', label: 'INGRESAR ALERTA' },
  { key: 'historial', label: 'HISTORIAL ALERTAS' },
];

const AlertasTabScreen = () => {
  const [activeTab, setActiveTab] = useState('ingresar');

  const router = require('expo-router').useRouter();
return (
  <View style={{ flex: 1, backgroundColor: '#2957a4' }}>

    <View style={styles.tabBar}>
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
    <View style={{ flex: 1 }}>
      {activeTab === 'ingresar' ? <AlertasScreen /> : <HistorialAlertasScreen />}
    </View>
  </View>
);
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#2957a4',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 10,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#fff',
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#2957a4',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomColor: '#fff',
    backgroundColor: '#2957a4',
  },
  tabLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeTabLabel: {
    color: '#fff',
    textDecorationLine: 'underline',
  },
});

export default AlertasTabScreen;
