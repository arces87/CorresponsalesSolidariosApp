import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import ApiService from '../services/ApiService';

export default function CrearClienteScreen() {
    const router = useRouter();
    const { userData, catalogos } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    // Estados para los campos del formulario
    const [tipoIdentificacion, setTipoIdentificacion] = useState('');
    const [identificacion, setIdentificacion] = useState('');
    const [nombres, setNombres] = useState('');
    const [apellidopaterno, setApellidoPaterno] = useState('');
    const [apellidomaterno, setApellidoMaterno] = useState('');
    const [genero, setGenero] = useState(true); // true: Masculino, false: Femenino
    const [email, setEmail] = useState('');
    const [telefonoMovil, setTelefonoMovil] = useState('');
    const [telefonoDomicilio, setTelefonoDomicilio] = useState('');
    const [direccion, setDireccion] = useState('');
    const [referenciaDomicilio, setReferenciaDomicilio] = useState('');
    const [pais, setPais] = useState('');
    const [estadoCivil, setEstadoCivil] = useState('');
    const [huellaDactilar, setHuellaDactilar] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [fechaTemporal, setFechaTemporal] = useState('');
    
    const onChangeFechaNacimiento = (event, selectedDate) => {
        if (Platform.OS === 'web') {
            // Para web, usamos el input type="date"
            if (event && event.target) {
                const fecha = event.target.value;
                if (fecha) {
                    const [year, month, day] = fecha.split('-');
                    const fechaObj = new Date(year, month - 1, day);
                    setFechaNacimiento(fechaObj);
                    setFechaTemporal(fecha);
                }
            }
        } else {
            // Para móvil, usamos el DateTimePicker nativo
            const currentDate = selectedDate || fechaNacimiento || new Date();
            setShowDatePicker(Platform.OS === 'ios');
            
            // Solo actualizar si se seleccionó una fecha (no en el evento de cierre)
            if (selectedDate) {
                setFechaNacimiento(currentDate);
            }
            
            // En Android, cerrar el picker después de seleccionar
            if (Platform.OS === 'android') {
                setShowDatePicker(false);
            }
        }
    };
    
    const showDatepicker = () => {
        if (Platform.OS === 'web') {
            // En web, el input date se activa automáticamente
            document.getElementById('fechaNacimientoInput')?.focus();
        } else {
            setShowDatePicker(true);
        }
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };
    
    const validatePhone = (phone) => {
        return /^[0-9]{7,15}$/.test(phone);
    };
    
    const validateIdentification = (id) => {
        // Validar que sea numérico y tenga 10 dígitos para cédula ecuatoriana
        return /^[0-9]{10}$/.test(id);
    };

    const validateForm = () => {
        const errors = [];
        
        // Validar tipo de identificación
        if (!tipoIdentificacion) {
            errors.push('Tipo de identificación es requerido');
        }
        
        // Validar número de identificación
        if (!identificacion) {
            errors.push('Número de identificación es requerido');
        } else if (!validateIdentification(identificacion)) {
            errors.push('El número de identificación no es válido (debe tener 10 dígitos)');
        }
        
        // Validar nombres y apellidos
        if (!nombres || !nombres.trim()) {
            errors.push('Nombres son requeridos');
        }
        
        if (!apellidopaterno || !apellidopaterno.trim()) {
            errors.push('Apellido paterno es requerido');
        }
        
        // Validar dirección
        if (!direccion || !direccion.trim()) {
            errors.push('La dirección es requerida');
        }
        
        // Validar referencia de domicilio (opcional)
        if (referenciaDomicilio && referenciaDomicilio.length > 200) {
            errors.push('La referencia de domicilio no debe exceder los 200 caracteres');
        }
        
        // Validar correo electrónico
        if (!email) {
            errors.push('Correo electrónico es requerido');
        } else if (!validateEmail(email)) {
            errors.push('El correo electrónico no es válido');
        }
        
        // Validar teléfonos
        if (!telefonoMovil) {
            errors.push('Número de teléfono móvil es requerido');
        } else if (!validatePhone(telefonoMovil)) {
            errors.push('El número de teléfono móvil debe tener entre 7 y 15 dígitos');
        }
        
        if (telefonoDomicilio && !validatePhone(telefonoDomicilio)) {
            errors.push('El número de teléfono domiciliario debe tener entre 7 y 15 dígitos');
        }
        
        // Validar fecha de nacimiento
        if (!fechaNacimiento) {
            errors.push('Fecha de nacimiento es requerida');
        } else {
            const fechaNac = new Date(fechaNacimiento);
            const hoy = new Date();
            const edad = hoy.getFullYear() - fechaNac.getFullYear();
            
            if (isNaN(fechaNac.getTime())) {
                errors.push('La fecha de nacimiento no es válida');
            } else if (fechaNac > hoy) {
                errors.push('La fecha de nacimiento no puede ser futura');
            } else if (edad < 18) {
                errors.push('El cliente debe ser mayor de edad');
            }
        }
        
        // Validar país
        if (!pais) {
            errors.push('Por favor seleccione un país');
        }
        
        // Validar estado civil
        if (!estadoCivil) {
            errors.push('Por favor seleccione un estado civil');
        }
        
        return errors;
    };

    const handleCrearCliente = async () => {
        const validationErrors = validateForm();
        
        if (validationErrors.length > 0) {
            alert(validationErrors.join('\n'));
            return;
        }

        setLoading(true);
        try {
            const clienteData = {
                secuencialTipoIdentificacion: tipoIdentificacion,
                identificacion,
                nombres,
                apellidoPaterno: apellidopaterno || '',
                apellidoMaterno: apellidomaterno|| '',
                esMasculino: genero,
                telefonoCelular: telefonoMovil,
                telefonoDomicilio: telefonoDomicilio || null,
                referenciaDomicilio: referenciaDomicilio || null,
                codigoPais: pais || 'EC', // Por defecto Ecuador si no se selecciona
                secuencialEstadoCivil: estadoCivil,
                huellaDactilar: huellaDactilar || null,
                mail: email,
                direccionDomiciliaria: direccion || '',
                fechaNacimiento: fechaNacimiento || null,
                usuario: userData?.usuario
            };

            const response = await ApiService.crearCliente(clienteData);

            if (response.success) {
                alert('Cliente creado correctamente', [
                    { text: 'Aceptar', onPress: () => router.back() }
                ]);
            } else {
                throw new Error(response.message || 'Error al crear el cliente');
            }
        } catch (error) {
            console.error('Error al crear cliente:', error);
            alert(error.message || 'Ocurrió un error al crear el cliente');
        } finally {
            setLoading(false);
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
                <ScrollView style={styles.scrollContainer}>
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
                                    <Text style={styles.headerTitle}>CREAR CLIENTE</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Tipo de Identificación *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={tipoIdentificacion}
                                    onValueChange={(itemValue) => {
                                        setTipoIdentificacion(itemValue);
                                    }}
                                    style={styles.picker}
                                    dropdownIconColor="#2B4F8C"
                                >
                                    {catalogos?.tiposIdentificaciones?.map((tipo) => (
                                        <Picker.Item 
                                            key={tipo.id} 
                                            label={tipo.nombre} 
                                            value={String(tipo.id)} 
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Identificación *</Text>
                            <TextInput
                                style={styles.input}
                                value={identificacion}
                                onChangeText={setIdentificacion}
                                placeholder="Ingrese la identificación"
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>                    

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Nombres *</Text>
                            <TextInput
                                style={styles.input}
                                value={nombres}
                                onChangeText={setNombres}
                                placeholder="Ingrese los nombres"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Apellido Paterno *</Text>
                            <TextInput
                                style={styles.input}
                                value={apellidopaterno}
                                onChangeText={setApellidoPaterno}
                                placeholder="Ingrese apellido paterno"
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Apellido Materno *</Text>
                            <TextInput
                                style={styles.input}
                                value={apellidomaterno}
                                onChangeText={setApellidoMaterno}
                                placeholder="Ingrese apellido materno"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Género *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={genero}
                                    onValueChange={setGenero}
                                    style={styles.picker}
                                    dropdownIconColor="#2B4F8C"
                                >
                                    <Picker.Item label="Masculino" value="M" />
                                    <Picker.Item label="Femenino" value="F" />
                                </Picker>
                            </View>
                        </View>                        

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Fecha de Nacimiento *</Text>
                            {Platform.OS === 'web' ? (
                                <input
                                    id="fechaNacimientoInput"
                                    type="date"
                                    value={fechaTemporal}
                                    onChange={onChangeFechaNacimiento}
                                    max={new Date().toISOString().split('T')[0]}
                                    style={styles.webDateInput}
                                    required
                                />
                            ) : (
                                <>
                                    <TouchableOpacity 
                                        style={[
                                            styles.dateInput,                                            
                                            { width: '100%' }
                                        ]} 
                                        onPress={showDatepicker}
                                    >
                                        <Text style={[styles.dateText, !fechaNacimiento && { color: '#999' }]}>
                                            {fechaNacimiento ? fechaNacimiento.toLocaleDateString('es-EC', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit'
                                            }) : 'Seleccione una fecha'}
                                        </Text>
                                    </TouchableOpacity>
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={fechaNacimiento || new Date()}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={onChangeFechaNacimiento}
                                            maximumDate={new Date()}
                                            locale="es-EC"
                                            themeVariant="light"
                                        />
                                    )}
                                </>
                            )}                            
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Teléfono Móvil *</Text>
                            <TextInput
                                style={styles.input}
                                value={telefonoMovil}
                                onChangeText={setTelefonoMovil}
                                placeholder="Ingrese el número de teléfono móvil"
                                keyboardType="phone-pad"
                                placeholderTextColor="#999"
                                maxLength={15}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Teléfono Domicilio</Text>
                            <TextInput
                                style={styles.input}
                                value={telefonoDomicilio}
                                onChangeText={setTelefonoDomicilio}
                                placeholder="Ingrese el teléfono de domicilio (opcional)"
                                keyboardType="phone-pad"
                                placeholderTextColor="#999"
                                maxLength={15}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Dirección *</Text>
                            <TextInput
                                style={styles.input}
                                value={direccion}
                                onChangeText={setDireccion}
                                placeholder="Ingrese la dirección completa"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Referencia de Domicilio</Text>
                            <TextInput
                                style={styles.input}
                                value={referenciaDomicilio}
                                onChangeText={setReferenciaDomicilio}
                                placeholder="Ej: Frente al parque central"
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={3}
                            />
                        </View>                        

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>País *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={pais}
                                    onValueChange={(itemValue) => setPais(itemValue)}
                                    style={styles.picker}
                                    dropdownIconColor="#2B4F8C"
                                >                                    
                                    {catalogos?.paises?.map((paisItem) => (
                                        <Picker.Item 
                                            key={paisItem.codigo} 
                                            label={paisItem.nombre} 
                                            value={paisItem.codigo} 
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Estado Civil *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={estadoCivil}
                                    onValueChange={(itemValue) => setEstadoCivil(itemValue)}
                                    style={styles.picker}
                                    dropdownIconColor="#2B4F8C"
                                >                                    
                                    {catalogos?.estadoCivil?.map((estado) => (
                                        <Picker.Item 
                                            key={estado.id} 
                                            label={estado.nombre} 
                                            value={String(estado.id)} 
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Huella Dactilar</Text>
                            <TextInput
                                style={styles.input}
                                value={huellaDactilar}
                                onChangeText={setHuellaDactilar}
                                placeholder="Código de huella dactilar"
                                placeholderTextColor="#999"
                                maxLength={50}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Correo Electrónico *</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="ejemplo@correo.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#999"
                            />
                        </View>
                        
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => router.back()}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>CANCELAR</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleCrearCliente}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>GUARDAR</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        paddingBottom: 20,
    },
    scrollContainer: {
        flex: 1,
        width: '100%',
        paddingBottom: 30,
    },
    headerWrapper: {
        width: '92%',
        alignSelf: 'center',
        paddingTop: 40,
        paddingBottom: 0,
    },
    header: {
        width: '100%',
        paddingTop: 20,
        marginBottom: 0,
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
        textAlign: 'center',
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
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        width: '90%',
        maxWidth: 500,
        borderRadius: 12,
        padding: 20,
        marginVertical: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        alignSelf: 'center',
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        color: '#2B4F8C',
        marginBottom: 5,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        color: '#333',
    },
    dateInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    dateText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'left',
        paddingVertical: 10,
    },    
    webDateInput: {        
        borderWidth: 1,
        borderColor: '#E6F7FF',
        borderRadius: 5,
        padding: 10,
        marginBottom: 16,
        backgroundColor: '#fff',
        fontFamily: 'System',
        fontSize: 15,
        color: '#333',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#2B4F8C',
        borderRadius: 5,
        marginBottom: 15,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        color: '#2B4F8C',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
    },
    saveButton: {
        backgroundColor: '#2B4F8C',
    },
    cancelButton: {
        backgroundColor: '#6c757d',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
