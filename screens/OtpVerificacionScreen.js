import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

const OtpVerificacionScreen = () => {
  const router = useRouter();
  const { monto, comision, total,labelTransaccion, otpCliente, otpAgente, accionTransaccion } = useLocalSearchParams();  
  const { userData } = useContext(AuthContext);  
  // Obtener configuración de validación de OTP de la operación
  const validarOtpCliente = otpCliente==='true'? true : false;
  const validarOtpAgente = otpAgente==='true'? true : false;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpCorresponsal, setOtpCorresponsal] = useState(['', '', '', '', '', '']);
  const otpInputs = useRef([]);
  const otpCorresponsalInputs = useRef([]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Keyboard visibility effect
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
/*
  useEffect(() => {
    console.log('userData', userData);
    const solicitarOtps = async () => {
      if(validarOtpAgente){
        try {
          const result = await ApiService.solicitarOtp({
            usuario: userData?.usuario,
            identificacion: userData?.identificacion,
            secuencialTipoIdentificacion: userData?.secuencialTipoIdentificacion,
            paraAgente: true, 
          });          
          if (result.otpGenerado) {
            if (result.notificationEmailError) {
              alert('Error enviando correo: '+ result.notificationEmailErrorMensaje);
              console.warn('Error enviando correo:', result.notificationEmailErrorMensaje);
              router.back();
            }
            if (result.notificationSMSError) {
              alert('Error enviando SMS: '+ result.notificationSMSErrorMensaje);
              console.warn('Error enviando SMS:', result.notificationSMSErrorMensaje);
              router.back();
            }
          }
        } catch (error) {
          alert('Error al solicitar OTP: ' + error.message);
          console.error('Error al solicitar OTP:', error.message);
          router.back();
        }
      }      
      if(validarOtpCliente){
        try {
          const result = await ApiService.solicitarOtp({
            usuario: userData?.usuario,
            identificacion: userData?.identificacion,
            secuencialTipoIdentificacion: userData?.secuencialTipoIdentificacion,
            paraAgente: false, 
          });
          console.log('Result:', result);
          if (result.otpGenerado) {
            if (result.notificationEmailError) {
              alert('Error enviando correo: '+ result.notificationEmailErrorMensaje);
              console.warn('Error enviando correo:', result.notificationEmailErrorMensaje);
              router.back();
            }
            if (result.notificationSMSError) {
              alert('Error enviando SMS: '+ result.notificationSMSErrorMensaje);
              console.warn('Error enviando SMS:', result.notificationSMSErrorMensaje);
              router.back();
            }
          }
        } catch (error) {
          alert('Error al solicitar OTP:'+ error.message);
          console.error('Error al solicitar OTP:', error.message);
          router.back();
        }
      }
    };

    solicitarOtps();
  }, [validarOtpAgente, validarOtpCliente, userData, transaccionData, router]);
*/
  const handleOtpChange = (value, index, isCorresponsal = false) => {
    if (isCorresponsal) {
      const newOtp = [...otpCorresponsal];
      newOtp[index] = value;
      setOtpCorresponsal(newOtp);

      // Auto focus next input
      if (value && index < 5) {
        otpCorresponsalInputs.current[index + 1].focus();
      }
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto focus next input
      if (value && index < 5) {
        otpInputs.current[index + 1].focus();
      }
    }

    // Auto submit when last digit is entered
    if (value && index === 5) {
      Keyboard.dismiss();
    }
  };

  const handleBackspace = (index, nativeEvent, isCorresponsal = false) => {
    if (nativeEvent.key === 'Backspace') {
      if (isCorresponsal) {
        if (!otpCorresponsal[index] && index > 0) {
          otpCorresponsalInputs.current[index - 1].focus();
        }
      } else {
        if (!otp[index] && index > 0) {
          otpInputs.current[index - 1].focus();
        }
      }
    }
  };

  const handleResendOtp = (isCorresponsal = false) => {
    if (countdown === 0) {
      // TODO: Call your API to resend OTP
      setCountdown(60);
      alert(`Se ha enviado un nuevo código OTP ${isCorresponsal ? 'al corresponsal' : 'al cliente'}`);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    const otpCorresponsalCode = otpCorresponsal.join('');
    
    // Validar código del cliente si está habilitado
    if (validarOtpCliente && otpCode.length !== 6) {
      alert('Por favor ingrese el código OTP del cliente completo');
      return;
    }
    
    // Validar código del corresponsal si está habilitado
    if (validarOtpAgente && otpCorresponsalCode.length !== 6) {
      alert('Por favor ingrese el código OTP del corresponsal completo');
      return;
    }

    try {
      setIsLoading(true);
      /*
      // Verificar OTP del cliente si está habilitado
      if (validarOtpCliente) {
        await ApiService.verificarOtp({
          usuario: userData?.usuario,
          identificacion: userData?.identificacioncliente,
          otp: otpCode,
          paraAgente: false
        });
      }
      
      // Verificar OTP del corresponsal si está habilitado
      if (validarOtpAgente) {
        await ApiService.verificarOtp({
          usuario: userData?.usuario,
          identificacion: userData?.identificacion,
          otp: otpCorresponsalCode,
          paraAgente: true
        });
      }
     
      if(accionTransaccion === 'deposito'){
        alert('Deposito');
        const response = await ApiService.procesarDeposito({
          secuencialCuenta: userData?.secuencialCuenta,
          numeroCuentaCliente: userData?.numeroCuentaCliente,
          tipoCuentaCliente: userData?.tipoCuentaCliente,
          valor: monto,
          nombreCliente: userData?.nombreCliente,
          identificacionCliente: userData?.identificacionCliente,
          tipoIdentificacionCliente: userData?.tipoIdentificacionCliente,          
          descripcion: accionTransaccion,
          usuario: userData?.usuario,
        });
        console.log('Response:', response);
      }
      */
      if(accionTransaccion === 'retiro'){
        alert('Retiro');
        /*
        const response = await ApiService.procesarRetiro({
          secuencialCuenta: userData?.secuencialCuenta,
          numeroCuentaCliente: userData?.numeroCuentaCliente,
          tipoCuentaCliente: userData?.tipoCuentaCliente,
          valor: monto,
          nombreCliente: userData?.nombreCliente,
          identificacionCliente: userData?.identificacionCliente,
          tipoIdentificacionCliente: userData?.tipoIdentificacionCliente,                   
          descripcion: accionTransaccion,
          usuario: userData?.usuario,
        });
        console.log('Response:', response);*/
      }

      router.push({
        pathname: '/comprobante',
        params: {
          fecha: new Date().toLocaleString('es-EC'),
          monto: monto,
          comision: comision,
          total: total,
          referencia: 'CS-20230826-001'          
        }
      });      
      
    } catch (error) {
      console.error('Error al verificar OTP:', error);
      alert(error.message || 'Error al verificar el código OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
              colors={['#2B4F8C', '#2BAC6B']}
              style={styles.gradient}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            >
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
          <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => router.back()}
                      >
                        <Text style={styles.backArrow}>{'←'}</Text>
                      </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>VERIFICACIÓN DE TRANSACCIÓN</Text>
          </View>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.instruction}>
          Hemos enviado un código de verificación a su número de teléfono y/o correo electrónico
        </Text>
        
        <View style={styles.transactionInfo}>          
          <Text style={styles.transactionType}>
            Datos de la transacción: {labelTransaccion}
          </Text>
          <Text style={styles.transactionType}>
          Cliente: {userData?.nombrecliente}
          </Text>
          <Text style={styles.transactionType}>
          Identificacion: {userData?.identificacioncliente}
          </Text>
          <Text style={styles.transactionType}>
          Valor: ${parseFloat(monto).toFixed(2)}
          </Text>
          <Text style={styles.transactionType}>
          Comisión: ${parseFloat(comision).toFixed(2)}
          </Text>
          <Text style={styles.amount}>Total: ${parseFloat(total).toFixed(2)}</Text>
        </View>

        {validarOtpCliente && (
          <>
            <Text style={styles.otpLabel}>Código del Cliente</Text>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <View key={`client-${index}`} style={styles.otpBox}>
                  <TextInput
                    ref={(ref) => (otpInputs.current[index] = ref)}
                    style={[
                      styles.otpText,
                      digit && styles.otpBoxFocused,
                      !validarOtpCliente && styles.otpDisabled
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index, false)}
                    onKeyPress={({ nativeEvent }) => handleBackspace(index, nativeEvent, false)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!isLoading && validarOtpCliente}
                    selectionColor="#007AFF"
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {validarOtpAgente && (
          <>
            <Text style={[styles.otpLabel, { marginTop: validarOtpCliente ? 25 : 0 }]}>Código del Corresponsal</Text>
            <View style={styles.otpContainer}>
              {otpCorresponsal.map((digit, index) => (
                <View key={`corresponsal-${index}`} style={styles.otpBox}>
                  <TextInput
                    ref={(ref) => (otpCorresponsalInputs.current[index] = ref)}
                    style={[
                      styles.otpText,
                      digit && styles.otpBoxFocused,
                      !validarOtpAgente && styles.otpDisabled
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index, true)}
                    onKeyPress={({ nativeEvent }) => handleBackspace(index, nativeEvent, true)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!isLoading && validarOtpAgente}
                    selectionColor="#007AFF"
                  />
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          style={[
            styles.button, 
            (isLoading || 
              (validarOtpCliente && otp.some(digit => !digit)) ||
              (validarOtpAgente && otpCorresponsal.some(digit => !digit))
            ) && styles.buttonDisabled
          ]}
          onPress={handleVerifyOtp}
          disabled={
            isLoading || 
            (validarOtpCliente && otp.some(digit => !digit)) ||
            (validarOtpAgente && otpCorresponsal.some(digit => !digit))
          }
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continuar</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            ¿No recibió el código?{' '}
            {countdown > 0 ? (
              <Text style={styles.resendDisabled}>
                Reenviar en {countdown}s
              </Text>
            ) : (
              <>
                <TouchableOpacity onPress={() => handleResendOtp(false)}>
                  <Text style={styles.resendLink}>Reenviar al cliente</Text>
                </TouchableOpacity>
                {' | '}
                <TouchableOpacity onPress={() => handleResendOtp(true)}>
                  <Text style={styles.resendLink}>Reenviar al corresponsal</Text>
                </TouchableOpacity>
              </>
            )}
          </Text>
        </View>
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
    justifyContent: 'flex-start',
  },
  headerWrapper: {
    width: '92%',
    alignSelf: 'center',   
    paddingTop: 40, 
    paddingBottom: 0   
  },
  header: {
    width: '100%',
    paddingTop: 20,
    marginBottom: 20,
    alignItems: 'center',
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
  headerTitleContainer: {
    flex: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    flex: 1,
  },
  card: {    
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: '90%',
    maxWidth: 500,
    borderRadius: 12,
    padding: 25,
    marginBottom: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  instruction: {
    fontSize: 16,
    color: '#2B4F8C',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  transactionInfo: {
    backgroundColor: '#F8FAFF',
    padding: 25,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E8ECFF',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B4F8C',
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 10,
    fontWeight: '400',
    textAlign: 'center',
  },
  otpLabel: {
    fontSize: 16,
    color: '#2B4F8C',
    marginBottom: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    marginBottom: 20,
  },
  otpBox: {
    borderBottomWidth: 2,
    borderBottomColor: '#2B4F8C',
    width: 45,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  otpText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
    padding: 0,
    width: '100%',
    textAlign: 'center',
  },
  otpBoxFocused: {
    borderBottomColor: '#007AFF',
  },
  otpDisabled: {
    opacity: 0.5,
    backgroundColor: '#f0f0f0',
  },
  button: {
    backgroundColor: '#2B4F8C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width: '90%',
    alignSelf: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  resendText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  resendLink: {
    color: '#2B4F8C',
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginHorizontal: 5,
  },
  resendDisabled: {
    color: '#999',
  },
});

export default OtpVerificacionScreen;
