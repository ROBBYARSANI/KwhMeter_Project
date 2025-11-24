import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useEffect, useState, useRef } from 'react';
import { useThemeMode } from '../../components/theme-context';
import { ScrollView, StyleSheet, Switch, View, TextInput, Platform, TouchableOpacity, Alert, DeviceEventEmitter, Linking, Animated, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Bluetooth setup dengan library yang lebih tepat untuk status monitoring
let BluetoothSerial;
let BluetoothStateManager;
let isBluetoothAvailable = false;
let isBluetoothStateManagerAvailable = false;

try {
  BluetoothSerial = require('react-native-bluetooth-classic');
  if (BluetoothSerial && typeof BluetoothSerial === 'object') {
    isBluetoothAvailable = true;
    console.log('Bluetooth serial module loaded');
  }
} catch (e) {
  console.log('Bluetooth serial module not available:', e.message);
  isBluetoothAvailable = false;
}

// Coba load Bluetooth State Manager untuk monitoring status
try {
  BluetoothStateManager = require('react-native-bluetooth-state-manager');
  if (BluetoothStateManager && typeof BluetoothStateManager === 'object') {
    isBluetoothStateManagerAvailable = true;
    console.log('Bluetooth state manager loaded');
  }
} catch (e) {
  console.log('Bluetooth state manager not available:', e.message);
  isBluetoothStateManagerAvailable = false;
}

// Slider setup
let Slider;
try {
  const _s = require('@react-native-community/slider');
  Slider = _s && _s.default ? _s.default : _s;
} catch (e) {
  Slider = () => null;
}

import MapViewModule from '@/components/map-view';

const MapView = MapViewModule?.MapView ?? MapViewModule?.default ?? MapViewModule;
const Marker = MapViewModule?.Marker ?? MapViewModule?.default?.Marker ?? null;
const Circle = MapViewModule?.Circle ?? MapViewModule?.default?.Circle ?? null;

export default function SettingsScreen() {
  const [autoManual, setAutoManual] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { darkModeEnabled, setDarkModeEnabled } = useThemeMode();

  const [kwhLimit, setKwhLimit] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [bluetoothStatus, setBluetoothStatus] = useState('Memeriksa...');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Animation values for dynamic display
  const backgroundColorAnim = useRef(new Animated.Value(0)).current;
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [region, setRegion] = useState(null);
  const [marker, setMarker] = useState(null);
  const [radius, setRadius] = useState(100);
  const [showMap, setShowMap] = useState(false);
  const [locationDescription, setLocationDescription] = useState('');

  const backgroundColor = darkModeEnabled ? '#1a1a1a' : '#f5f5f5';
  const sectionBackgroundColor = darkModeEnabled ? '#232323' : '#ffffff';
  const sectionTitleColor = darkModeEnabled ? '#e0e0e0' : '#232323';
  const settingItemBackgroundColor = sectionBackgroundColor;
  const settingTextColor = darkModeEnabled ? '#fafafa' : '#232323';

  useEffect(() => {
    loadStoredData();
    initializeBluetoothStatus();

    // Cleanup function
    return () => {
      // Cleanup listeners jika ada
    };
  }, []);

  async function loadStoredData() {
    try {
      const max = await AsyncStorage.getItem('maxKwh');
      if (max) setKwhLimit(max);
      const gf = await AsyncStorage.getItem('geofence');
      if (gf) {
        const obj = JSON.parse(gf);
        setGeofenceEnabled(true);
        setMarker(obj.coordinate || null);
        setRadius(obj.radius || 100);
        if (obj.coordinate) setRegion({ ...obj.coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      }
    } catch (e) {}
  }

  // Inisialisasi monitoring status Bluetooth
  async function initializeBluetoothStatus() {
    setIsCheckingStatus(true);
    
    try {
      // Gunakan Bluetooth State Manager jika tersedia
      if (isBluetoothStateManagerAvailable) {
        console.log('Using Bluetooth State Manager for status monitoring');
        
        // Dapatkan status awal
        const currentState = await BluetoothStateManager.getState();
        updateBluetoothStatus(currentState);
        
        // Setup listener untuk perubahan status
        BluetoothStateManager.onStateChange((state) => {
          console.log('Bluetooth state changed:', state);
          updateBluetoothStatus(state);
        }, true);
        
      } else {
        // Fallback ke metode lama dengan polling
        console.log('Using fallback Bluetooth status checking');
        await checkBluetoothStatusFallback();
        
        // Setup polling setiap 5 detik
        const interval = setInterval(async () => {
          await checkBluetoothStatusFallback();
        }, 5000);
        
        // Cleanup interval nanti
        return () => clearInterval(interval);
      }
    } catch (error) {
      console.error('Error initializing Bluetooth status:', error);
      setBluetoothStatus('Error monitoring status');
    } finally {
      setIsCheckingStatus(false);
    }
  }

  // Update status Bluetooth berdasarkan state
  function updateBluetoothStatus(state) {
    let statusText = 'Tidak Diketahui';
    let isEnabled = false;

    switch (state) {
      case 'on':
      case 'powered_on':
      case 'enabled':
      case 'turned_on':
        statusText = 'Bluetooth ON';
        isEnabled = true;
        break;
      case 'off':
      case 'powered_off':
      case 'disabled':
      case 'turned_off':
        statusText = 'Bluetooth OFF';
        isEnabled = false;
        break;
      case 'turning_on':
        statusText = 'Bluetooth Menyala...';
        break;
      case 'turning_off':
        statusText = 'Bluetooth Mematikan...';
        break;
      case 'unauthorized':
        statusText = 'Izin Bluetooth Diperlukan';
        break;
      case 'unsupported':
        statusText = 'Bluetooth Tidak Didukung';
        break;
      default:
        statusText = `Status: ${state}`;
    }

    setBluetoothStatus(statusText);
    return isEnabled;
  }

  // Fallback method untuk cek status Bluetooth
  async function checkBluetoothStatusFallback() {
    if (!isBluetoothAvailable) {
      setBluetoothStatus('Bluetooth Tidak Tersedia');
      return false;
    }

    try {
      let enabled = false;

      // Coba berbagai method untuk cek status Bluetooth
      if (BluetoothSerial.isEnabled) {
        enabled = await BluetoothSerial.isEnabled();
      } else if (BluetoothSerial.isBluetoothEnabled) {
        enabled = await BluetoothSerial.isBluetoothEnabled();
      } else if (BluetoothSerial.getBluetoothState) {
        const state = await BluetoothSerial.getBluetoothState();
        enabled = state === 'enabled' || state === 'powered_on';
      }

      setBluetoothStatus(enabled ? 'Bluetooth ON' : 'Bluetooth OFF');
      return enabled;
    } catch (error) {
      console.error('Error checking Bluetooth status:', error);
      setBluetoothStatus('Error checking status');
      return false;
    }
  }

  // Function untuk membuka pengaturan Bluetooth
  async function openBluetoothSettings() {
    try {
      // Coba menggunakan Bluetooth State Manager untuk mengaktifkan Bluetooth
      if (isBluetoothStateManagerAvailable) {
        try {
          await BluetoothStateManager.requestEnable();
          // Status akan diupdate via listener
          return;
        } catch (enableError) {
          console.log('Could not enable via manager, falling back to settings:', enableError);
        }
      }

      // Fallback: buka pengaturan sistem
      if (Platform.OS === 'android') {
        await Linking.openSettings();
      } else {
        await Linking.openURL('App-Prefs:Bluetooth');
      }
    } catch (error) {
      console.error('Error opening Bluetooth settings:', error);
      Alert.alert('Error', 'Tidak dapat membuka pengaturan Bluetooth');
    }
  }

  // Scan devices dengan approach yang lebih sederhana
  async function scanBluetoothDevices() {
    if (!isBluetoothAvailable) {
      Alert.alert('Error', 'Bluetooth tidak tersedia di perangkat ini');
      return;
    }

    setIsConnecting(true);
    setAvailableDevices([]);
    
    try {
      console.log('Starting Bluetooth scan...');
      
      // Cek status Bluetooth dulu
      const isEnabled = await checkBluetoothStatusFallback();
      if (!isEnabled) {
        Alert.alert(
          'Bluetooth Dimatikan', 
          'Silakan nyalakan Bluetooth terlebih dahulu di pengaturan perangkat Anda',
          [
            { text: 'Buka Pengaturan', onPress: openBluetoothSettings },
            { text: 'Batal', style: 'cancel' }
          ]
        );
        setIsConnecting(false);
        return;
      }

      // Dapatkan paired devices - ini tidak butuh permission location
      let devices = [];
      
      // Coba semua method yang mungkin
      if (BluetoothSerial.getBondedDevices) {
        console.log('Using getBondedDevices...');
        devices = await BluetoothSerial.getBondedDevices();
      } else if (BluetoothSerial.list) {
        console.log('Using list...');
        devices = await BluetoothSerial.list();
      } else if (BluetoothSerial.getPairedDevices) {
        console.log('Using getPairedDevices...');
        devices = await BluetoothSerial.getPairedDevices();
      } else {
        // Fallback: coba akses properti langsung
        console.log('Trying direct property access...');
        devices = BluetoothSerial.pairedDevices || BluetoothSerial.bondedDevices || [];
      }

      console.log('Raw devices found:', devices);
      
      // Filter untuk ESP32 devices
      const esp32Devices = devices.filter(device => {
        const name = device.name || '';
        const address = device.address || device.id || '';
        
        console.log(`Checking device: ${name} (${address})`);
        
        return (
          name === 'ESP32_Classic' || 
          name.includes('ESP32') || 
          name.includes('HC-05') ||
          name.includes('HC-06') ||
          name.includes('Bluetooth')
        );
      });

      console.log('ESP32 devices filtered:', esp32Devices);
      setAvailableDevices(esp32Devices);
      
      if (esp32Devices.length === 0) {
        Alert.alert(
          'Device Tidak Ditemukan', 
          `Tidak ada device ESP32 yang terdeteksi. \n\nPastikan:\n• ESP32_Classic sudah dipaired di pengaturan Bluetooth\n• Bluetooth ESP32 dalam mode discoverable\n• Device dalam jangkauan\n\nDevices yang ditemukan: ${devices.map(d => d.name).join(', ') || 'Tidak ada'}`,
          [{ text: 'OK' }]
        );
      } else {
        // Auto-select device ESP32_Classic jika ada
        const esp32Classic = esp32Devices.find(d => d.name === 'ESP32_Classic');
        setSelectedDevice(esp32Classic || esp32Devices[0]);
      }

    } catch (error) {
      console.error('Bluetooth scan error:', error);
      Alert.alert(
        'Scan Error', 
        `Gagal scanning devices: ${error.message}\n\nPastikan Anda telah memberikan izin Bluetooth jika diminta.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsConnecting(false);
    }
  }

  // Kirim data WiFi ke ESP32
  async function sendWiFiToESP32() {
    if (!wifiSsid || !wifiPassword) {
      Alert.alert('Error', 'Harap masukkan SSID dan Password WiFi');
      return;
    }

    if (!selectedDevice) {
      Alert.alert('Pilih Device', 'Harap pilih device ESP32 terlebih dahulu');
      return;
    }

    setIsConnecting(true);

    try {
      console.log('Attempting to connect to:', selectedDevice);

      // Connect ke device
      let connection;
      const deviceId = selectedDevice.address || selectedDevice.id;
      
      if (BluetoothSerial.connect) {
        console.log('Using connect method...');
        connection = await BluetoothSerial.connect(deviceId);
      } else if (BluetoothSerial.connectToDevice) {
        console.log('Using connectToDevice method...');
        connection = await BluetoothSerial.connectToDevice(deviceId);
      } else if (BluetoothSerial.connectDevice) {
        console.log('Using connectDevice method...');
        connection = await BluetoothSerial.connectDevice(deviceId);
      } else {
        throw new Error('Tidak ada method connect yang tersedia');
      }

      console.log('Connected successfully');

      // Kirim data dalam format sederhana
      const wifiData = `WIFI:${wifiSsid},${wifiPassword}\n`;
      console.log('Sending data:', wifiData);

      let result;
      if (BluetoothSerial.write) {
        result = await BluetoothSerial.write(wifiData);
      } else if (BluetoothSerial.writeToDevice) {
        result = await BluetoothSerial.writeToDevice(deviceId, wifiData);
      } else if (connection && connection.write) {
        result = await connection.write(wifiData);
      } else {
        throw new Error('Tidak ada method write yang tersedia');
      }

      console.log('Data sent successfully:', result);

      // Tunggu sebentar sebelum disconnect
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Disconnect
      if (BluetoothSerial.disconnect) {
        await BluetoothSerial.disconnect();
      } else if (BluetoothSerial.disconnectFromDevice) {
        await BluetoothSerial.disconnectFromDevice(deviceId);
      } else if (connection && connection.disconnect) {
        await connection.disconnect();
      }

      console.log('Disconnected successfully');
      setIsConnecting(false);
      Alert.alert('Sukses', 'Konfigurasi WiFi berhasil dikirim ke ESP32');

    } catch (error) {
      console.error('Bluetooth connection error:', error);
      setIsConnecting(false);
      
      let errorMessage = error.message;
      if (errorMessage.includes('Unable to connect') || errorMessage.includes('Connection failed')) {
        errorMessage = 'Gagal terhubung ke device. Pastikan:\n• ESP32_Classic tidak sedang digunakan aplikasi lain\n• Device dalam jangkauan\n• Coba unpair dan pair ulang device';
      } else if (errorMessage.includes('Device not found')) {
        errorMessage = 'Device tidak ditemukan. Pastikan device sudah dipaired dan dalam jangkauan.';
      } else if (errorMessage.includes('Permission')) {
        errorMessage = 'Izin Bluetooth tidak diberikan. Silakan berikan izin Bluetooth di pengaturan aplikasi.';
      }
      
      Alert.alert('Koneksi Gagal', errorMessage);
    }
  }

  // Function untuk location (tetap sama)
  async function requestLocationPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  async function requestAndDetectLocation() {
    const ok = await requestLocationPermission();
    if (!ok) {
      Alert.alert('Permission denied', 'Location permission is required for auto-detect.');
      return;
    }
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      const { latitude, longitude } = location.coords;
      setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      setMarker({ latitude, longitude });
      setShowMap(true);
    } catch (err) {
      Alert.alert('Location error', err.message);
    }
  }

  async function saveGeofence() {
    if (!marker) return Alert.alert('No location', 'Please select a location first');
    const obj = { coordinate: marker, radius };
    try {
      await AsyncStorage.setItem('geofence', JSON.stringify(obj));
      Alert.alert('Saved', 'Geofence saved');
    } catch (e) {
      Alert.alert('Error', 'Failed to save geofence');
    }
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: backgroundColor}]}> 
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* WiFi Configuration Section */}
        <ThemedView style={[styles.section, { backgroundColor: sectionBackgroundColor }]}>
          <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>Konfigurasi WiFi ESP32</ThemedText>
          <View style={styles.wifiContainer}>
            
            {/* Status Bluetooth */}
            <View style={[styles.statusContainer, {
              backgroundColor: 
                bluetoothStatus === 'Bluetooth ON' ? '#e8f5e8' : 
                bluetoothStatus === 'Bluetooth OFF' ? '#ffebee' :
                bluetoothStatus.includes('Menyala') || bluetoothStatus.includes('Mematikan') ? '#fff3cd' :
                '#fff3cd'
            }]}>
              <View style={styles.statusRow}>
                <View style={styles.statusTextContainer}>
                  <ThemedText style={[styles.settingText, {
                    color: 
                      bluetoothStatus === 'Bluetooth ON' ? '#2e7d32' : 
                      bluetoothStatus === 'Bluetooth OFF' ? '#d32f2f' :
                      bluetoothStatus.includes('Menyala') || bluetoothStatus.includes('Mematikan') ? '#856404' :
                      '#856404'
                  }]}>
                    Status: {bluetoothStatus}
                  </ThemedText>
                  {isCheckingStatus && (
                    <ActivityIndicator size="small" color="#856404" style={styles.loadingIndicator} />
                  )}
                </View>
                {bluetoothStatus === 'Bluetooth OFF' && (
                  <TouchableOpacity
                    style={styles.enableBtButton}
                    onPress={openBluetoothSettings}
                  >
                    <ThemedText style={styles.enableBtButtonText}>Nyalakan</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
              {bluetoothStatus === 'Bluetooth OFF' && (
                <ThemedText style={[styles.settingText, { color: '#d32f2f', fontSize: 14, marginTop: 4 }]}>
                  Bluetooth diperlukan untuk mengkonfigurasi ESP32
                </ThemedText>
              )}
              {(bluetoothStatus.includes('Menyala') || bluetoothStatus.includes('Mematikan')) && (
                <ThemedText style={[styles.settingText, { color: '#856404', fontSize: 14, marginTop: 4 }]}>
                  Sedang memproses...
                </ThemedText>
              )}
            </View>

            {/* Device Selection */}
            <ThemedText style={[styles.settingText, { color: settingTextColor, marginBottom: 8 }]}>
              Pilih Device Bluetooth
            </ThemedText>
            
            <TouchableOpacity
              style={[styles.scanButton, (isConnecting || bluetoothStatus !== 'Bluetooth ON') && styles.buttonDisabled]}
              onPress={scanBluetoothDevices}
              disabled={isConnecting || bluetoothStatus !== 'Bluetooth ON'}
            >
              {isConnecting ? (
                <View style={styles.buttonLoading}>
                  <ActivityIndicator size="small" color="#fff" />
                  <ThemedText style={styles.buttonText}>Scanning...</ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.buttonText}>
                  Scan Bluetooth Devices
                </ThemedText>
              )}
            </TouchableOpacity>

            {availableDevices.length > 0 && (
              <View style={styles.deviceList}>
                <ThemedText style={[styles.settingText, { color: settingTextColor, marginTop: 12, marginBottom: 8 }]}>
                  Device Tersedia:
                </ThemedText>
                {availableDevices.map((device, index) => (
                  <TouchableOpacity
                    key={device.address || device.id || index}
                    style={[
                      styles.deviceItem,
                      selectedDevice?.address === device.address && styles.selectedDeviceItem
                    ]}
                    onPress={() => setSelectedDevice(device)}
                  >
                    <ThemedText style={styles.deviceName}>
                      {device.name}
                    </ThemedText>
                    <ThemedText style={styles.deviceAddress}>
                      {device.address || device.id}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedDevice && (
              <View style={styles.selectedDeviceContainer}>
                <ThemedText style={[styles.settingText, { color: '#4CAF50' }]}>
                  Selected: {selectedDevice.name}
                </ThemedText>
              </View>
            )}

            <ThemedText style={[styles.settingText, { color: settingTextColor, marginTop: 12, marginBottom: 8 }]}>
              Nama WiFi (SSID)
            </ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: darkModeEnabled ? '#333' : '#f5f5f5',
                color: settingTextColor,
                borderColor: '#4CAF50'
              }]}
              value={wifiSsid}
              onChangeText={setWifiSsid}
              placeholder="Masukkan SSID WiFi"
              placeholderTextColor={darkModeEnabled ? '#888' : '#aaa'}
            />
            
            <ThemedText style={[styles.settingText, { color: settingTextColor, marginTop: 12, marginBottom: 8 }]}>
              Password WiFi
            </ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: darkModeEnabled ? '#333' : '#f5f5f5',
                color: settingTextColor,
                borderColor: '#4CAF50'
              }]}
              value={wifiPassword}
              onChangeText={setWifiPassword}
              placeholder="Masukkan Password WiFi"
              placeholderTextColor={darkModeEnabled ? '#888' : '#aaa'}
              secureTextEntry
            />
            
            <TouchableOpacity
              style={[styles.button, (!selectedDevice || isConnecting || bluetoothStatus !== 'Bluetooth ON') && styles.buttonDisabled]}
              onPress={sendWiFiToESP32}
              disabled={!selectedDevice || isConnecting || bluetoothStatus !== 'Bluetooth ON'}
            >
              {isConnecting ? (
                <View style={styles.buttonLoading}>
                  <ActivityIndicator size="small" color="#fff" />
                  <ThemedText style={styles.buttonText}>Mengirim...</ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.buttonText}>
                  Kirim ke ESP32
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Geofencing Section - TIDAK DIUBAH */}
        <ThemedView style={[styles.section, { backgroundColor: sectionBackgroundColor }]}> 
          <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>Geofencing / Lokasi Meter</ThemedText>
          <ThemedView style={[styles.settingItem, { backgroundColor: settingItemBackgroundColor, flexDirection: 'column', alignItems: 'flex-start' }]}>
            <View style={{ width: '100%', marginBottom: 8 }}>
              <ThemedText style={[styles.settingText, { color: settingTextColor }]}>Geofence</ThemedText>
              <Switch value={geofenceEnabled} onValueChange={setGeofenceEnabled} trackColor={{ false: '#767577', true: '#4CAF50' }} />
            </View>
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
              <TouchableOpacity onPress={async () => { await requestAndDetectLocation(); setShowMap(true); }} style={{ padding: 8, backgroundColor: '#4CAF50', borderRadius: 8 }}>
                <ThemedText style={{ color: '#fff' }}>Auto-deteksi Lokasi</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowMap(true)} style={{ padding: 8, backgroundColor: '#888', borderRadius: 8 }}>
                <ThemedText style={{ color: '#fff' }}>Pilih Manual</ThemedText>
              </TouchableOpacity>
            </View>

            {showMap && (
              <View style={{ width: '100%', height: 360 }}>
                {Platform.OS !== 'web' && MapView ? (
                  <MapView style={{ flex: 1 }} initialRegion={region || { latitude: -6.2, longitude: 106.816666, latitudeDelta: 0.01, longitudeDelta: 0.01 }} region={region} onPress={e => { const { latitude, longitude } = e.nativeEvent.coordinate; setMarker({ latitude, longitude }); setLocationDescription(`Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`); }}>
                    {marker && Marker && (<Marker coordinate={marker} draggable onDragEnd={e => { setMarker(e.nativeEvent.coordinate); setLocationDescription(`Latitude: ${e.nativeEvent.coordinate.latitude.toFixed(6)}, Longitude: ${e.nativeEvent.coordinate.longitude.toFixed(6)}`); }} />)}
                    {marker && Circle && (<Circle center={marker} radius={radius} strokeWidth={1} strokeColor={'rgba(76,175,80,0.6)'} fillColor={'rgba(76,175,80,0.2)'} />)}
                  </MapView>
                ) : (
                  <View style={{ flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 16, justifyContent: 'center', alignItems: 'center' }}>
                    <ThemedText style={{ textAlign: 'center' }}>
                      {Platform.OS === 'web'
                        ? 'Map view is not available on web.\nPlease use the mobile app for full geofencing features.'
                        : 'Map view failed to load.\nEnsure Google Maps API key is configured in app.config.js and AndroidManifest.xml for Android builds.'}
                    </ThemedText>
                    {Platform.OS === 'web' && (
                      <ThemedText style={{ marginTop: 12, color: '#777', textAlign: 'center' }}>
                        If you're testing in Expo Go, note that react-native-maps may not be available — use a development build (EAS) or run on a simulator with the native module installed.
                      </ThemedText>
                    )}
                    {marker && (
                      <View style={{ marginTop: 16 }}>
                        <ThemedText>Selected Location:</ThemedText>
                        <ThemedText>Latitude: {marker.latitude.toFixed(6)}</ThemedText>
                        <ThemedText>Longitude: {marker.longitude.toFixed(6)}</ThemedText>
                      </View>
                    )}
                  </View>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => setRadius(100)} style={{ padding: 6, backgroundColor: '#357e38ff', borderRadius: 6 }}><ThemedText>100m</ThemedText></TouchableOpacity>
                    <TouchableOpacity onPress={() => setRadius(200)} style={{ padding: 6, backgroundColor: '#357e38ff', borderRadius: 6 }}><ThemedText>200m</ThemedText></TouchableOpacity>
                    <TouchableOpacity onPress={() => setRadius(500)} style={{ padding: 6, backgroundColor: '#357e38ff', borderRadius: 6 }}><ThemedText>500m</ThemedText></TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={async () => { await saveGeofence(); setShowMap(false); }} style={{ padding: 8, backgroundColor: '#4CAF50', borderRadius: 8 }}><ThemedText style={{ color: '#fff' }}>Save</ThemedText></TouchableOpacity>
                </View>

                <View style={{ marginTop: 8 }}>
                  <ThemedText style={{ color: settingTextColor }}>Radius: {radius} m</ThemedText>
                  <Slider minimumValue={50} maximumValue={1000} step={10} value={radius} onValueChange={setRadius} minimumTrackTintColor="#4CAF50" maximumTrackTintColor="#ccc" style={{ width: '100%' }} />
                </View>

                {locationDescription !== '' && (
                  <View style={{ marginTop: 16 }}>
                    <ThemedText style={[styles.settingText, { color: settingTextColor, marginBottom: 8 }]}>Keterangan Lokasi</ThemedText>
                    <TextInput
                      style={[styles.locationTextBox, {
                        backgroundColor: darkModeEnabled ? '#333' : '#f5f5f5',
                        color: settingTextColor,
                        borderColor: '#4CAF50'
                      }]}
                      value={locationDescription}
                      editable={false}
                      multiline={true}
                      numberOfLines={2}
                      placeholder="Ketika Anda klik lokasi pada map, keterangan akan muncul di sini"
                      placeholderTextColor={darkModeEnabled ? '#888' : '#aaa'}
                    />
                  </View>
                )}
              </View>
            )}
          </ThemedView>
        </ThemedView>

        {/* Preferences Section - TIDAK DIUBAH */}
        <ThemedView style={[styles.section, { backgroundColor: sectionBackgroundColor }]}> 
          <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>Preferensi</ThemedText>
          <ThemedView style={[styles.settingItem, { backgroundColor: settingItemBackgroundColor }]}> 
            <ThemedText style={[styles.settingText, { color: settingTextColor }]}>Mode Gelap</ThemedText>
            <Switch value={darkModeEnabled} onValueChange={setDarkModeEnabled} trackColor={{ false: '#767577', true: '#4CAF50' }} />
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#1a1a1a' },
  scrollContainer: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { paddingBottom: 16 },
  section: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#4CAF50', marginBottom: 12 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingText: { fontSize: 16, fontWeight: '500' },
  wifiContainer: {
    width: '100%',
  },
  statusContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    minWidth: '100%',
    fontSize: 16,
    marginBottom: 8,
  },
  scanButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#888',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceList: {
    marginBottom: 12,
  },
  deviceItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedDeviceItem: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 12,
    color: '#666',
  },
  selectedDeviceContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  locationTextBox: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    minWidth: '100%',
    textAlignVertical: 'top',
    fontSize: 14,
    fontWeight: '500',
  },
  enableBtButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  enableBtButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});