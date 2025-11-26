import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { useThemeMode } from '../../components/theme-context';
import { useNotifications } from './_layout';
import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, View, Platform, Alert, Vibration, TextInput } from 'react-native';
import { useMaxKwh } from '../../hooks/use-max-kwh';
import { startGeofencingMonitoring, stopGeofencingMonitoring } from '../../services/geofencingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const PowerUsageCard = ({ cardBackground, textColor, powerUsage, maxKwh }) => {
  const percent = Math.min(100, Math.round((powerUsage / maxKwh) * 100));
  
  const getProgressColor = () => {
    if (percent <= 70) return '#4CAF50';
    if (percent <= 90) return '#FF9800';
    return '#F44336';
  };

  return (
    <ThemedView style={[styles.card, styles.elevatedCard, { backgroundColor: cardBackground }]}>
      <View style={styles.cardHeader}>
        <ThemedText type="defaultSemiBold" style={{ color: textColor }}>Energi digunakan</ThemedText>
      </View>
      <View style={styles.powerContainer}>
        <ThemedText type="title" style={{ color: textColor }}>{powerUsage.toFixed(2)}</ThemedText>
        <ThemedText style={[styles.powerUnit, { color: textColor }]}>KWh</ThemedText>
      </View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBackground, { backgroundColor: textColor === '#fafafa' ? '#333' : '#eee' }]}>
          <View style={[styles.progressFill, { 
            width: `${percent}%`, 
            backgroundColor: getProgressColor() 
          }]} />
        </View>
        <ThemedText style={[styles.percentage, { color: getProgressColor() }]}>{percent}%</ThemedText>
      </View>
    </ThemedView>
  );
};

const StatsCard = ({ title, value, icon, cardBackground, textColor }) => {
  return (
    <ThemedView style={[styles.statsCard, styles.elevatedCard, { backgroundColor: cardBackground }]}>
      <View style={styles.cardHeader}>
        <ThemedText type="default" style={{ color: textColor }}>{title}</ThemedText>
        <Ionicons name={icon} size={20} color="#4CAF50" />
      </View>
      <ThemedText type="subtitle" style={{ color: textColor }}>{value}</ThemedText>
    </ThemedView>
  );
};

export default function HomeScreen() {
  const { darkModeEnabled } = useThemeMode();
  const { maxKwh, saveMaxKwh } = useMaxKwh();
  const { addNotification } = useNotifications();
  const backgroundColor = darkModeEnabled ? '#1a1a1a' : '#f5f5f5';
  const cardBackground = darkModeEnabled ? '#232323' : '#ffffff';
  const textColor = darkModeEnabled ? '#fafafa' : '#232323';

  const [kwhLimit, setKwhLimit] = useState(maxKwh.toString());

  useEffect(() => {
    setKwhLimit(maxKwh.toString());
  }, [maxKwh]);

  const lastNotificationTime = useRef(0);

  const [data, setData] = useState({
    powerUsage: 0,
    voltage: 0,
    current: 0,
    power: 0, // Pastikan power ada di state awal
    consumed: 0,
    relayState: false,
    timestamp: 0
  });
  const [usageHistory, setUsageHistory] = useState(Array(24).fill(0));
  const [now, setNow] = useState(new Date());
  const [isSwitchOn, setIsSwitchOn] = useState(false);

  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    setIsSwitchOn(data.relayState);
  }, [data.relayState]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const initializeHistory = () => {
      const currentHour = new Date().getHours();
      const history = Array(24).fill(0);
      history[currentHour] = 0.1;
      setUsageHistory(history);
    };

    initializeHistory();

    let interval = setInterval(() => {
      fetch('https://kwh-meter-project-backend.vercel.app/api/realtime')
        .then(res => res.json())
        .then((newData) => {
          setData(newData);
          setUsageHistory(prev => {
            const hour = new Date().getHours();
            const updated = [...prev];
            // Gunakan power untuk incremental consumption, fallback ke consumed jika power tidak ada
            const incrementalConsumption = newData.power || newData.consumed || 0;
            updated[hour] = Math.max(0, (updated[hour] || 0) + incrementalConsumption);
            return updated;
          });
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Initialize geofencing and notifications
  useEffect(() => {
    const initializeAppFeatures = async () => {
      try {
        const Notifications = Constants.appOwnership !== 'expo' ? await import('expo-notifications').then(m => m.default) : null;

        if (Notifications) {
          // Request notification permissions
          const { status: notificationPerm } = await Notifications.requestPermissionsAsync();
          console.log('Notification permissions:', notificationPerm);

          // Set notification handler
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
            }),
          });
        } else {
          console.log('Running in Expo Go, push notifications not supported for power alerts');
        }

        // Initialize geofencing if geofence is configured
        const geofenceData = await AsyncStorage.getItem('geofence');
        if (geofenceData) {
          const geofence = JSON.parse(geofenceData);
          if (geofence.coordinate && geofence.radius) {
            await startGeofencingMonitoring();
            console.log('Geofencing monitoring started');
          }
        }
      } catch (error) {
        console.error('Error initializing app features:', error);
      }
    };

    initializeAppFeatures();

    // Cleanup function
    return () => {
      stopGeofencingMonitoring();
    };
  }, []);

  useEffect(() => {
    if (data.powerUsage > maxKwh) {
      const now = Date.now();
      if (now - lastNotificationTime.current > 60000) {
        lastNotificationTime.current = now;
        scheduleLocalNotificationAndAddToLog();
        
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
    }
  }, [data.powerUsage, maxKwh]);

  async function scheduleLocalNotificationAndAddToLog() {
    addNotification({
      title: "⚡ Daya Melebihi Batas!",
      value: `${data.powerUsage.toFixed(2)} KWh`,
      description: `Konsumsi daya Anda telah melampaui batas ${maxKwh} kWh. Penggunaan saat ini: ${data.powerUsage.toFixed(2)} kWh.`,
      type: "warning",
    });

    Vibration.vibrate(500);

    Alert.alert(
      "⚡ Daya Melebihi Batas!",
      `Konsumsi daya Anda telah melampaui batas ${maxKwh} kWh. Penggunaan saat ini: ${data.powerUsage.toFixed(2)} kWh.`,
      [
        {
          text: "OK",
          style: "default",
          onPress: () => console.log("User acknowledged warning")
        },
        {
          text: "View Details",
          style: "cancel",
          onPress: () => console.log("User wants to view details")
        }
      ],
      { cancelable: true }
    );
  }

  const handleToggle = async () => {
    const newState = !isSwitchOn;
    setIsSwitchOn(newState);
    try {
      await fetch('https://kwh-meter-project-backend.vercel.app/api/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state: newState }),
      });
    } catch (error) {
      console.log('Failed to toggle switch', error);
    }
  };

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['January', 'February', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'Desember'];
  const dayName = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');

  return (
    <ScrollView 
      style={{ backgroundColor }}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Warning Banner */}
      {showWarning && (
        <View style={[styles.warningBanner, { backgroundColor: '#FF6B35' }]}>
          <Ionicons name="warning" size={20} color="white" />
          <ThemedText style={styles.warningText}>
            Power usage exceeded! Current: {data.powerUsage.toFixed(2)} kWh (Limit: {maxKwh} kWh)
          </ThemedText>
        </View>
      )}

      <ThemedView style={[styles.header, { backgroundColor }]}>
        <View>
          <ThemedText type="default" style={{ color: textColor }}>
            {`${dayName}, ${date} ${month} ${year} ${hour}:${minute}`}
          </ThemedText>
        </View>
      </ThemedView>
      
      {/* Main Content Container */}
      <View style={styles.contentContainer}>
        <PowerUsageCard
          cardBackground={cardBackground}
          textColor={textColor}
          powerUsage={data.powerUsage}
          maxKwh={maxKwh}
        />

        {/* KWh Limit Input */}
        <ThemedView style={[styles.kwhLimitCard, styles.elevatedCard, { backgroundColor: cardBackground }]}>
          <ThemedText type="defaultSemiBold" style={{ color: textColor, marginBottom: 12 }}>Batas Konsumsi kWh</ThemedText>
          <TextInput
            style={[styles.kwhInput, {
              backgroundColor: darkModeEnabled ? '#333' : '#f5f5f5',
              color: textColor,
              borderColor: '#4CAF50'
            }]}
            keyboardType="numeric"
            value={kwhLimit}
            onChangeText={(val) => {
              setKwhLimit(val);
              if (val && !isNaN(parseFloat(val))) {
                saveMaxKwh(val);
              }
            }}
            placeholder="Ex: 3 kWh"
            placeholderTextColor={darkModeEnabled ? '#888' : '#aaa'}
          />
        </ThemedView>

        {/* First Row of Stats */}
        <View style={styles.statsRow}>
          <StatsCard 
            title="Tegangan" 
            value={`${data.voltage} V`} 
            icon="flash" 
            cardBackground={cardBackground} 
            textColor={textColor} 
          />
          <View style={styles.cardSpacer} />
          {/* UBAH DI SINI: Menggunakan data.power bukan data.consumed */}
          <StatsCard 
            title="Daya" 
            value={`${data.power} Watt`} 
            icon="battery-charging" 
            cardBackground={cardBackground} 
            textColor={textColor} 
          />
        </View>
        
        {/* Second Row of Stats */}
        <View style={styles.statsRow}>
          <StatsCard 
            title="Arus" 
            value={`${data.current} A`} 
            icon="speedometer" 
            cardBackground={cardBackground} 
            textColor={textColor} 
          />
          <View style={styles.cardSpacer} />
          <ThemedView style={[styles.switchCard, styles.elevatedCard, { backgroundColor: cardBackground }]}>
            <ThemedText type="default" style={{ color: textColor, marginBottom: 8 }}>Switch</ThemedText>
            <TouchableOpacity style={[styles.switchButton, isSwitchOn ? styles.switchOn : styles.switchOff]} onPress={handleToggle}>
              <ThemedText type="defaultSemiBold" style={styles.switchText}>{isSwitchOn ? 'On' : 'Off'}</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: StatusBar.currentHeight || 0,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: StatusBar.currentHeight || 0,
    borderRadius: 12,
  },
  warningText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  elevatedCard: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  powerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  powerUnit: {
    color: '#888',
    fontSize: 16,
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackground: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  percentage: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'stretch',
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    flex: 1,
  },
  cardSpacer: {
    width: 16,
  },
  switchCard: {
    borderRadius: 16,
    padding: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
  },
  switchOn: {
    backgroundColor: '#4CAF50',
  },
  switchOff: {
    backgroundColor: '#F44336',
  },
  switchText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  chartCard: {
    borderRadius: 20,
    padding: 24,
  },
  yLabel: {
    fontSize: 12,
  },
  xLabel: {
    fontSize: 10,
  },
  kwhLimitCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  kwhInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    minWidth: 120,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
});