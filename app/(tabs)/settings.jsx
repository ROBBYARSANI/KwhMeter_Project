import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useEffect, useState } from 'react';
import { useThemeMode } from '../../components/theme-context';
import { ScrollView, StyleSheet, Switch, View, TextInput, Platform, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Some bundlers / Babel setups can produce a runtime helper interop issue
// (_interopRequireDefault is not a function). Use a safe require fallback
// for native modules that may export as CommonJS.
let Slider;
try {
  // prefer .default when present, otherwise use the module itself
  const _s = require('@react-native-community/slider');
  Slider = _s && _s.default ? _s.default : _s;
} catch (e) {
  // provide a noop placeholder to avoid crashes while debugging
  Slider = () => null;
}
import MapViewModule from '@/components/map-view';

// Resolve MapView/Marker/Circle from the platform-specific module.
// Try multiple shapes: named export, default export, or direct module.
const MapView = MapViewModule?.MapView ?? MapViewModule?.default ?? MapViewModule;
const Marker = MapViewModule?.Marker ?? MapViewModule?.default?.Marker ?? null;
const Circle = MapViewModule?.Circle ?? MapViewModule?.default?.Circle ?? null;

// Debug: help determine if the native module is present at runtime
if (typeof console !== 'undefined') {
  console.log('MapViewModule:', MapViewModule);
  console.log('Resolved MapView:', MapView, 'Marker:', Marker, 'Circle:', Circle);
}

export default function SettingsScreen() {
  const [autoManual, setAutoManual] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { darkModeEnabled, setDarkModeEnabled } = useThemeMode();

  // kWh limit
  const [kwhLimit, setKwhLimit] = useState('');

  // Geofence states
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [region, setRegion] = useState(null);
  const [marker, setMarker] = useState(null);
  const [radius, setRadius] = useState(100);
  const [showMap, setShowMap] = useState(false);

  const backgroundColor = darkModeEnabled ? '#1a1a1a' : '#f5f5f5';
  const sectionBackgroundColor = darkModeEnabled ? '#232323' : '#ffffff';
  const sectionTitleColor = darkModeEnabled ? '#e0e0e0' : '#232323';
  const settingItemBackgroundColor = sectionBackgroundColor;
  const settingTextColor = darkModeEnabled ? '#fafafa' : '#232323';

  useEffect(() => {
    // load stored values
    (async () => {
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
    })();
  }, []);

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
                  // Only render native MapView when it's available. If not, show a helpful message.
                  <MapView style={{ flex: 1 }} initialRegion={region || { latitude: -6.2, longitude: 106.816666, latitudeDelta: 0.01, longitudeDelta: 0.01 }} region={region} onPress={e => { const { latitude, longitude } = e.nativeEvent.coordinate; setMarker({ latitude, longitude }); }}>
                    {marker && Marker && (<Marker coordinate={marker} draggable onDragEnd={e => setMarker(e.nativeEvent.coordinate)} />)}
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
              </View>
            )}

          </ThemedView>
        </ThemedView>

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
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, backgroundColor: '#1a1a1a' },
  headerTitle: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  scrollContainer: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { paddingBottom: 16 },
  section: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#4CAF50', marginBottom: 12 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingText: { fontSize: 16, fontWeight: '500' },
});
