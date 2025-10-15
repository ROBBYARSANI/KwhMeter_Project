import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

// Komponen PowerUsageCard
const PowerUsageCard = () => {
  return (
    <ThemedView style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText type="defaultSemiBold">Power Usage</ThemedText>
        <Ionicons name="information-circle-outline" size={20} color="#888" />
      </View>
      
      <View style={styles.powerContainer}>
        <ThemedText type="title">30.276</ThemedText>
        <ThemedText style={styles.powerUnit}>KWh</ThemedText>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View style={styles.progressFill} />
        </View>
        <ThemedText style={styles.percentage}>40%</ThemedText>
      </View>
    </ThemedView>
  );
};

// Komponen StatsCard
const StatsCard = ({ title, value, icon }) => {
  return (
    <ThemedView style={styles.statsCard}>
      <View style={styles.cardHeader}>
        <ThemedText type="default">{title}</ThemedText>
        <Ionicons name={icon} size={20} color="#4CAF50" />
      </View>
      <ThemedText type="subtitle">{value}</ThemedText>
    </ThemedView>
  );
};

// Komponen ElectricityChart
const ElectricityChart = () => {
  const timeLabels = ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  
  return (
    <ThemedView style={styles.chartCard}>
      <ThemedText type="defaultSemiBold">Electricity Used Today</ThemedText>
      <ThemedText type="title">140.65KWh</ThemedText>
      
      <View style={styles.chartContainer}>
        <View style={styles.yAxis}>
          <ThemedText style={styles.yLabel}>200kWh</ThemedText>
          <ThemedText style={styles.yLabel}>150kWh</ThemedText>
          <ThemedText style={styles.yLabel}>100kWh</ThemedText>
          <ThemedText style={styles.yLabel}>50kWh</ThemedText>
          <ThemedText style={styles.yLabel}>0</ThemedText>
        </View>
        
        <View style={styles.barsContainer}>
          <View style={styles.barGroup}>
            {[60, 80, 120, 160, 140, 100].map((height, index) => (
              <View key={index} style={styles.barColumn}>
                <View 
                  style={[
                    styles.bar, 
                    { height: `${height/200 * 100}%` }
                  ]} 
                />
                <ThemedText style={styles.xLabel}>{timeLabels[index]}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ThemedView>
  );
};

export default function HomeScreen() {
  return (
    <ScrollView>
      
      {/* Header */}
      <ThemedView style={styles.header}>
        <View>
          <ThemedText type="default">Monday 18, 2023</ThemedText>
        </View>
      </ThemedView>

      {/* Power Usage Card */}
      <PowerUsageCard />

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <StatsCard title="Voltage" value="15.2 v" icon="flash" />
        <StatsCard title="Consumed" value="28.2 kwh" icon="battery-charging" />
      </View>

      <View style={styles.statsRow}>
        <StatsCard title="Current" value="3.2 A" icon="speedometer" />
        <ThemedView style={styles.switchCard}>
          <ThemedText type="default">Switch</ThemedText>
          <TouchableOpacity style={styles.switchButton}>
            <ThemedText type="defaultSemiBold" style={styles.switchText}>On</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>

      {/* Electricity Chart */}
      <ElectricityChart />

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