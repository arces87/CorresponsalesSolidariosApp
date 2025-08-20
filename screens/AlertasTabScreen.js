import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AlertasScreen from './AlertasScreen';
import HistorialAlertasScreen from './HistorialAlertasScreen';

const TABS = [
  { key: 'ingresar', label: 'INGRESAR ALERTA' },
  { key: 'historial', label: 'HISTORIAL ALERTAS' },
];

const { width } = Dimensions.get('window');

const AlertasTabScreen = () => {
  const [activeTab, setActiveTab] = useState('ingresar');
  const router = require('expo-router').useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2B4F8C', '#2B4F8C']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Text style={styles.backArrow}>{'←'}</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>ALERTAS</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {activeTab === 'ingresar' ? <AlertasScreen /> : <HistorialAlertasScreen />}
        </View>
      </LinearGradient>
    </View>
  );
};

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
    marginBottom: 10,
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
    maxWidth: 500,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  backButton: {
    zIndex: 1,
    padding: 10,
    marginLeft: -10,
  },
  backArrow: {
    color: '#fff',
    fontSize: 35,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    margin: 10,
    borderRadius: 25,
    overflow: 'hidden',
    width: '90%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: 'bold',
  },
  activeTabLabel: {
    color: '#fff',
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
});

export default AlertasTabScreen;
