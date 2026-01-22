import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por ErrorBoundary:', error);
    console.error('Error Info:', errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Error en la aplicación</Text>
          <Text style={styles.message}>
            {this.state.error?.toString() || 'Ha ocurrido un error inesperado'}
          </Text>
          {__DEV__ && this.state.errorInfo && (
            <ScrollView style={styles.stackContainer}>
              <Text style={styles.stackLabel}>Stack Trace:</Text>
              <Text style={styles.stack}>{this.state.errorInfo.componentStack}</Text>
            </ScrollView>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#d32f2f'
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center'
  },
  stackContainer: {
    marginTop: 20,
    maxHeight: 300,
    width: '100%'
  },
  stackLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 5
  },
  stack: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace'
  }
});

export default ErrorBoundary;
