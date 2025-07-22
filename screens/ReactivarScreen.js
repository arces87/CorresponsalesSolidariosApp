import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import * as Device from 'expo-device';

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function ReactivarScreen() {
    const router = useRouter();  
    const { userData } = useContext(AuthContext);

    // Función para obtener el DEVICE_ID (igual que en LoginScreen)
    const getDeviceId = async () => {
        try {
            const deviceId = Device.osInternalBuildId || Device.deviceName || '';
            return deviceId;
        } catch (error) {
            console.error('Error al obtener el Device ID:', error);
            return '';
        }
    };

    // Función para generar un GUID tipo UUID v4 a partir del IMEI
    function getGUID(imei) {
        let hash = 0;
        if (!imei) return '';
        for (let i = 0; i < imei.length; i++) {
            hash = ((hash << 5) - hash) + imei.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16).padStart(16, '0');
    }

    const handleActivacion = async () => {
        if (!userData.usuario || !userData.contrasenia) {
            alert('Por favor ingrese usuario y clave.');
            return;
        }
        try {            
            const imei = await getDeviceId();
            const mac = getGUID(imei);
            const latitud = 0;
            const longitud = 0;
            /* const response = await ApiService.solicitudActivacion({
                usuario: userData.usuario,
                contrasenia: userData.contrasenia,
                imei: imei,
                mac: mac,
                latitud,
                longitud,
            }); */
            alert(userData.usuario + " " + userData.contrasenia);
            alert('Solicitud de activación enviada correctamente.');
            router.replace('/');
        } catch (error) {
            alert('Error en la activación: ' + (error.message || error));
        }
    };


    return (
        <View style={styles.container}>
            <View style={styles.topSection}>
                <Image source={require('../assets/location-icon.png')} style={styles.icon} resizeMode="contain" />
            </View>
            <View style={styles.card}>
                <Text style={styles.title}>ACTIVAR DISPOSITIVO</Text>
                <Text style={styles.subtitle}>Ingrese a Corresponsales Solidarios para activar el dispositivo</Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.button} onPress={handleActivacion}>
                        <Text style={styles.buttonText}>SÍ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
                        <Text style={styles.buttonText}>NO</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3267b2',
        alignItems: 'center',
    },
    topSection: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 50,
    },    
    icon: {
        width: 120,
        height: 120,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        width: '90%',
        alignItems: 'center',
        marginTop: -30,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    title: {
        color: '#3267b2',
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        color: '#3267b2',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 28,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
    },
    button: {
        flex: 1,
        backgroundColor: '#3267b2',
        paddingVertical: 12,
        marginHorizontal: 8,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
