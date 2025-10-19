import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useThemeMode } from '../../components/theme-context';
import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

const PowerUsageCard = ({ cardBackground, textColor, powerUsage }) => {
  const maxKwh = 30;
  const percent = Math.min(100, Math.round((powerUsage / maxKwh) * 100));
  return (
    <ThemedView style={[styles.card, { backgroundColor: cardBackground }] }>
      <View style={styles.cardHeader}>
        <ThemedText type="defaultSemiBold" style={{ color: textColor }}>Power Usage</ThemedText>
        <Ionicons name="information-circle-outline" size={20} color={textColor} />
      </View>
      <View style={styles.powerContainer}>
        <ThemedText type="title" style={{ color: textColor }}>{powerUsage.toFixed(2)}</ThemedText>
        <ThemedText style={[styles.powerUnit, { color: textColor }]}>KWh</ThemedText>
      </View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBackground, { backgroundColor: textColor === '#fafafa' ? '#333' : '#eee' }] }>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <ThemedText style={[styles.percentage, { color: '#4CAF50' }]}>{percent}%</ThemedText>
      </View>
    </ThemedView>
  );
};

const StatsCard = ({ title, value, icon, cardBackground, textColor }) => {
  return (
    <ThemedView style={[styles.statsCard, { backgroundColor: cardBackground }] }>
      <View style={styles.cardHeader}>
        <ThemedText type="default" style={{ color: textColor }}>{title}</ThemedText>
        <Ionicons name={icon} size={20} color="#4CAF50" />
      </View>
      <ThemedText type="subtitle" style={{ color: textColor }}>{value}</ThemedText>
    </ThemedView>
  );
};

const ElectricityChart = ({ cardBackground, textColor, usageHistory }) => {
  const maxKwh = 100;
  const hourLabels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');
  const kwhLabels = [100, 80, 60, 40, 20, 0];

  const heightChart = 180;
  const marginTopYAxis = -15;
  const marginBottomXAxis = -3;

  return (
    <ThemedView style={[styles.chartCard, { backgroundColor: cardBackground, borderWidth: 1, borderColor: '#ccc' }] }>
      <ThemedText type="defaultSemiBold" style={{ color: textColor }}>Electricity Used Today</ThemedText>
      <View style={{ flexDirection: 'row', marginTop: 30 }}>
        <View style={{ justifyContent: 'space-between', marginRight: 10, height: heightChart, marginTop: marginTopYAxis }}>
          {kwhLabels.map(kwh => (
            <ThemedText key={kwh} style={[styles.yLabel, { color: textColor }]}>{kwh} kWh</ThemedText>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'flex-end', height: heightChart }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: heightChart }}>
            {usageHistory.map((kwh, hour) => (
              <View key={hour} style={{ alignItems: 'center', width: 32 }}>
                <View style={{
                  width: 18,
                  height: `${Math.max(8, Math.min(100, (kwh / maxKwh) * heightChart))}px`,
                  backgroundColor: '#4CAF50',
                  borderRadius: 4,
                  marginBottom: marginBottomXAxis,
                }} />
                <ThemedText style={[styles.xLabel, { color: textColor, fontSize: 10 }]}>{hourLabels[hour]}</ThemedText>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ThemedView>
  );
};

export default function HomeScreen() {
  const { darkModeEnabled } = useThemeMode();
  const backgroundColor = darkModeEnabled ? '#1a1a1a' : '#f5f5f5';
  const cardBackground = darkModeEnabled ? '#232323' : '#ffffff';
  const textColor = darkModeEnabled ? '#fafafa' : '#232323';

  const [data, setData] = useState({
    powerUsage: 0,
    voltage: 0,
    current: 0,
    consumed: 0,
    timestamp: 0
  });
  const [usageHistory, setUsageHistory] = useState(Array(24).fill(0));
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval = setInterval(() => {
      fetch('http://localhost:4000/api/realtime')
        .then(res => res.json())
        .then((newData) => {
          setData(newData);
          setUsageHistory(prev => {
            const hour = new Date().getHours();
            const updated = [...prev];
            updated[hour] = newData.powerUsage;
            return updated;
          });
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayName = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');

  return (
    <ScrollView style={{ backgroundColor }}>
      <ThemedView style={[styles.header, { backgroundColor }] }>
        <View>
          <ThemedText type="default" style={{ color: textColor }}>{`${dayName}, ${date} ${month} ${year} ${hour}:${minute}`}</ThemedText>
        </View>
      </ThemedView>
      <PowerUsageCard cardBackground={cardBackground} textColor={textColor} powerUsage={data.powerUsage} />
      <View style={styles.statsRow}>
        <StatsCard title="Voltage" value={`${data.voltage} V`} icon="flash" cardBackground={cardBackground} textColor={textColor} />
        <StatsCard title="Consumed" value={`${data.consumed} kWh`} icon="battery-charging" cardBackground={cardBackground} textColor={textColor} />
      </View>
      <View style={styles.statsRow}>
        <StatsCard title="Current" value={`${data.current} A`} icon="speedometer" cardBackground={cardBackground} textColor={textColor} />
        <ThemedView style={[styles.switchCard, { backgroundColor: cardBackground }] }>
          <ThemedText type="default" style={{ color: textColor }}>Switch</ThemedText>
          <TouchableOpacity style={styles.switchButton}>
            <ThemedText type="defaultSemiBold" style={styles.switchText}>On</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
      <ElectricityChart cardBackground={cardBackground} textColor={textColor} usageHistory={usageHistory} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: StatusBar.currentHeight || 0,
  },
  battery: {
    padding: 8,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    margin: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  powerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  powerUnit: {
    color: '#888',
    fontSize: 16,
    marginLeft: 5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    width: '40%',
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  percentage: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 15,
  },
  statsCard: {
    borderRadius: 15,
    padding: 20,
    flex: 1,
    marginRight: 10,
  },
  switchCard: {
    borderRadius: 15,
    padding: 20,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  switchText: {
    color: 'white',
  },
  chartCard: {
    borderRadius: 20,
    padding: 20,
    margin: 16,
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  yAxis: {
    justifyContent: 'space-between',
    marginRight: 10,
    height: 150,
  },
  yLabel: {
    color: '#888',
    fontSize: 12,
  },
  barsContainer: {
    flex: 1,
  },
  barGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    backgroundColor: '#4CAF50',
    width: '70%',
    borderRadius: 4,
    marginBottom: 5,
    minHeight: 10,
  },
  xLabel: {
    color: '#888',
    fontSize: 10,
  },
});
