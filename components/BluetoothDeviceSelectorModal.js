import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

/**
 * Modal para seleccionar una impresora Bluetooth de la lista de dispositivos emparejados.
 *
 * @param {boolean} visible - Controla la visibilidad del modal
 * @param {Array<{name?: string, address?: string, id?: string}>} dispositivos - Lista de dispositivos a mostrar
 * @param {boolean} [imprimiendo] - Si true, muestra un spinner sobre el dispositivo seleccionado y bloquea la lista
 * @param {string|null} [deviceIdSeleccionado] - address del dispositivo que se está conectando/imprimiendo
 * @param {Function} onSelect - (device) => void  llamado al elegir un dispositivo
 * @param {Function} onClose - Función llamada al cerrar/cancelar
 */
export default function BluetoothDeviceSelectorModal({
  visible,
  dispositivos = [],
  imprimiendo = false,
  deviceIdSeleccionado = null,
  onSelect,
  onClose,
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const modalWidth = Math.min(windowWidth * 0.9, 420);
  const listMaxHeight = Math.max(200, Math.min(420, Math.round(windowHeight * 0.5)));

  const getDeviceKey = (item, index) =>
    item?.address || item?.id || item?.deviceId || `device-${index}`;

  const getDeviceName = (item) =>
    (item?.name && String(item.name).trim()) ||
    (item?.deviceName && String(item.deviceName).trim()) ||
    'Dispositivo sin nombre';

  const getDeviceAddress = (item) =>
    item?.address || item?.id || item?.deviceId || '';

  const renderItem = ({ item, index }) => {
    const address = getDeviceAddress(item);
    const seleccionado = imprimiendo && deviceIdSeleccionado === address;
    const deshabilitado = imprimiendo;

    return (
      <TouchableOpacity
        key={getDeviceKey(item, index)}
        style={[styles.deviceRow, deshabilitado && styles.deviceRowDisabled]}
        onPress={() => !deshabilitado && onSelect && onSelect(item)}
        activeOpacity={0.7}
        disabled={deshabilitado}
      >
        <View style={styles.deviceIcon}>
          <MaterialIcons name="print" size={22} color="#2B4F8C" />
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {getDeviceName(item)}
          </Text>
          {address ? (
            <Text style={styles.deviceAddress} numberOfLines={1}>
              {address}
            </Text>
          ) : null}
        </View>
        {seleccionado ? (
          <ActivityIndicator color="#2B4F8C" size="small" />
        ) : (
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={imprimiendo ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { width: modalWidth }]}>
          <LinearGradient
            colors={['#2B4F8C', '#1E3A5F']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerIcon}>
              <MaterialIcons name="bluetooth-searching" size={32} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>Seleccione la impresora</Text>
            <Text style={styles.headerSubtitle}>
              {dispositivos.length === 1
                ? '1 dispositivo Bluetooth disponible'
                : `${dispositivos.length} dispositivos Bluetooth disponibles`}
            </Text>
          </LinearGradient>

          <View style={[styles.listWrapper, { maxHeight: listMaxHeight }]}>
            {dispositivos.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="bluetooth-disabled" size={36} color="#999" />
                <Text style={styles.emptyText}>
                  No hay dispositivos para mostrar.
                </Text>
              </View>
            ) : (
              <FlatList
                data={dispositivos}
                keyExtractor={getDeviceKey}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                showsVerticalScrollIndicator
              />
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelButton, imprimiendo && styles.cancelButtonDisabled]}
              onPress={onClose}
              disabled={imprimiendo}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>
                {imprimiendo ? 'Imprimiendo...' : 'Cancelar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  listWrapper: {
    backgroundColor: '#fff',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  deviceRowDisabled: {
    opacity: 0.5,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  deviceAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 68,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
