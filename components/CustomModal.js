import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

/**
 * Componente de modal personalizado y estético
 * Reemplaza los Alert.alert nativos con un diseño moderno
 * 
 * @param {boolean} visible - Controla la visibilidad del modal
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje del modal
 * @param {string} type - Tipo de modal: 'success', 'error', 'warning', 'info' (default)
 * @param {string} buttonText - Texto del botón (default: 'OK')
 * @param {Function} onClose - Función que se ejecuta al cerrar el modal
 */
export default function CustomModal({
  visible,
  title,
  message,
  type = 'info',
  buttonText = 'OK',
  onClose,
}) {
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle',
          iconColor: '#4CAF50',
          gradientColors: ['#4CAF50', '#2BAC6B'],
          backgroundColor: '#E8F5E9',
        };
      case 'error':
        return {
          icon: 'error',
          iconColor: '#E74C3C',
          gradientColors: ['#E74C3C', '#C0392B'],
          backgroundColor: '#FFEBEE',
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: '#F39C12',
          gradientColors: ['#F39C12', '#E67E22'],
          backgroundColor: '#FFF3E0',
        };
      default: // info
        return {
          icon: 'info',
          iconColor: '#2B4F8C',
          gradientColors: ['#2B4F8C', '#1E3A5F'],
          backgroundColor: '#E3F2FD',
        };
    }
  };

  const { icon, iconColor, gradientColors, backgroundColor } = getIconAndColor();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={gradientColors}
            style={styles.gradientHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={[styles.iconContainer, { backgroundColor: backgroundColor }]}>
              <MaterialIcons name={icon} size={40} color={iconColor} />
            </View>
          </LinearGradient>

          <View style={styles.content}>
            {title && (
              <Text style={styles.title} allowFontScaling={false}>
                {title}
              </Text>
            )}
            {message && (
              <Text style={styles.message} allowFontScaling={false}>
                {message}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: iconColor }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText} allowFontScaling={false}>
                {buttonText}
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
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientHeader: {
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
