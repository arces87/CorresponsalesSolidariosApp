import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#2C6EB4',      // Azul principal
  secondary: '#2BAC6B',    // Verde
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  darkGray: '#333333',
  error: '#D32F2F',
  success: '#388E3C',
};

export const globalStyles = StyleSheet.create({
  // Contenedor principal con gradiente
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  
  // Fondo con gradiente
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  
  // Tarjeta blanca para formularios
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Título de la pantalla
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // Etiquetas de los campos
  label: {
    color: colors.darkGray,
    marginBottom: 5,
    fontWeight: '500',
  },
  
  // Campos de texto
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  
  // Botón principal
  button: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  
  // Texto del botón
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Contenedor para el logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  
  // Logo
  logo: {
    width: 150,
    height: 120,
    resizeMode: 'contain',
  },
  
  // Contenedor de error
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  
  // Texto de error
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  
  // Enlaces/Texto secundario
  secondaryText: {
    color: colors.primary,
    textAlign: 'center',
    marginTop: 15,
  },
});

export default globalStyles;
