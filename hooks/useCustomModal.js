import { useState } from 'react';

/**
 * Hook personalizado para manejar el CustomModal de forma sencilla
 * 
 * @returns {Object} Objeto con funciones y estados para manejar el modal
 */
export function useCustomModal() {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    message: '',
    type: 'info',
    buttonText: 'OK',
  });

  /**
   * Muestra el modal con los datos especificados
   * @param {string} title - Título del modal
   * @param {string} message - Mensaje del modal
   * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
   * @param {string} buttonText - Texto del botón (opcional)
   */
  const mostrarModal = (title, message, type = 'info', buttonText = 'OK') => {
    setModalData({ title, message, type, buttonText });
    setModalVisible(true);
  };

  /**
   * Cierra el modal
   */
  const cerrarModal = () => {
    setModalVisible(false);
  };

  /**
   * Muestra un modal de éxito
   */
  const mostrarExito = (title, message) => {
    mostrarModal(title, message, 'success');
  };

  /**
   * Muestra un modal de error
   * Procesa el mensaje para extraer solo la parte después de los dos puntos si existe
   */
  const mostrarError = (title, message) => {
    let processedMessage = message;
    
    // Si el mensaje contiene dos puntos, extraer solo la parte después del primer ":"
    if (message && typeof message === 'string' && message.includes(':')) {
      const partes = message.split(':');
      if (partes.length > 1) {
        // Tomar todo después del primer ":" y eliminar espacios al inicio
        processedMessage = partes.slice(1).join(':').trim();
      }
    }
    
    mostrarModal(title, processedMessage, 'error');
  };

  /**
   * Muestra un modal de advertencia
   */
  const mostrarAdvertencia = (title, message) => {
    mostrarModal(title, message, 'warning');
  };

  /**
   * Muestra un modal de información
   */
  const mostrarInfo = (title, message) => {
    mostrarModal(title, message, 'info');
  };

  return {
    modalVisible,
    modalData,
    mostrarModal,
    cerrarModal,
    mostrarExito,
    mostrarError,
    mostrarAdvertencia,
    mostrarInfo,
  };
}
