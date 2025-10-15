import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function StatisticsScreen() {
  const [activeTab, setActiveTab] = useState('Month');

  const tabs = ['Day', 'Week', 'Month', 'Year'];
  const chartData = [
    { month: 'Mar', value: 120 },
    { month: 'Apr', value: 180 },
    { month: 'May', value: 160 },
    { month: 'Jun', value: 200 }
  ];

  const maxValue = 200;

  return (
    <ScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={null}>
      
      <ThemedView style={styles.container}>
        {/* Header Title */}
        <ThemedText type="title" style={styles.headerTitle}>Statistics</ThemedText>

        {/* Energy Generated Card */}
        <ThemedView style={styles.energyCard}>
          <View style={styles.energyHeader}>
            <ThemedText type="defaultSemiBold" style={styles.energyTitle}>
              Energy generated
            </ThemedText>
            <View style={styles.increaseBadge}>
              <Ionicons name="caret-up" size={16} color="#4CAF50" />
              <ThemedText style={styles.increaseText}>2.13Wh (14%)</ThemedText>
            </View>
          </View>
          <ThemedText type="title" style={styles.energyValue}>30.276KWh</ThemedText>
        </ThemedView>

        {/* Time Filter Tabs */}
        <ThemedView style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <ThemedText 
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText
                ]}
              >
                {tab}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>

        {/* Bar Chart */}
        <ThemedView style={styles.chartCard}>
          <View style={styles.chartContainer}>
            {/* Y-axis labels */}
            <View style={styles.yAxis}>
              <ThemedText style={styles.yLabel}>200KWh</ThemedText>
              <ThemedText style={styles.yLabel}>150KWh</ThemedText>
              <ThemedText style={styles.yLabel}>100KWh</ThemedText>
              <ThemedText style={styles.yLabel}>50KWh</ThemedText>
              <ThemedText style={styles.yLabel}>0</ThemedText>
            </View>
            
            {/* Chart bars */}
            <View style={styles.chartBars}>
              {chartData.map((item, index) => (
                <View key={index} style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    <View 
                      style={[
                        styles.bar,
                        { height: `${(item.value / maxValue) * 100}%` }
                      ]} 
                    />
                  </View>
                  <ThemedText style={styles.xLabel}>{item.month}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        </ThemedView>

        {/* Stats Cards Row */}
        <View style={styles.statsRow}>
          {/* Today Card */}
          <ThemedView style={styles.statsCard}>
            <ThemedText style={styles.statsValue}>150kWh</ThemedText>
            <ThemedText style={styles.statsLabel}>Today</ThemedText>
          </ThemedView>

          {/* This Month Card */}
          <ThemedView style={styles.statsCard}>
            <ThemedText style={styles.statsValue}>165KWh</ThemedText>
            <ThemedText style={styles.statsLabel}>This month</ThemedText>
          </ThemedView>
        </View>

      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  energyCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  energyTitle: {
    fontSize: 16,
    color: '#888',
  },
  increaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  increaseText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  energyValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#1a1a1a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  activeTabText: {
    color: '#4CAF50',
  },
  chartCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
  },
  yAxis: {
    justifyContent: 'space-between',
    marginRight: 15,
    height: 200,
  },
  yLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    minHeight: 10,
  },
  xLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statsLabel: {
    fontSize: 14,
    color: '#888',
  },
});