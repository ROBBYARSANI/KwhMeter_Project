import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useEffect, useState, useRef } from 'react';
import { useThemeMode } from '../../components/theme-context';
import { ScrollView, StyleSheet, Switch, View, TextInput, Platform, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { startGeofencingMonitoring, stopGeofencingMonitoring } from '../../services/geofencingService';

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

  // Save notification setting when changed
  useEffect(() => {
    AsyncStorage.setItem('phoneNotifications', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  const [kwhLimit, setKwhLimit] = useState('');

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
      const notifEnabled = await AsyncStorage.getItem('phoneNotifications');
      if (notifEnabled !== null) setNotificationsEnabled(JSON.parse(notifEnabled));
    } catch (e) {}
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
          <ThemedView style={[styles.settingItem, { backgroundColor: settingItemBackgroundColor }]}>
            <ThemedText style={[styles.settingText, { color: settingTextColor }]}>Notifikasi Hp</ThemedText>
            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#767577', true: '#4CAF50' }} />
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
