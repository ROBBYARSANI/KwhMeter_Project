import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

export default function SettingsScreen() {
  const [autoManual, setAutoManual] = useState(true);

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Settings
        </ThemedText>
      </View>

      {/* Settings Content */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Alarm Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Alarmat</ThemedText>
          <ThemedView style={styles.settingItem}>
            <ThemedText style={styles.settingText}>aaaaa</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Auto/Manual Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Operation Mode</ThemedText>
          <ThemedView style={styles.settingItem}>
            <ThemedText style={styles.settingText}>Auto/Manual</ThemedText>
            <Switch
              value={autoManual}
              onValueChange={setAutoManual}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={autoManual ? '#f4f3f4' : '#f4f3f4'}
            />
          </ThemedView>
        </ThemedView>

        {/* Additional Settings bisa ditambahkan di sini */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>
          <ThemedView style={styles.settingItem}>
            <ThemedText style={styles.settingText}>Notifications</ThemedText>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
            />
          </ThemedView>
          <ThemedView style={styles.settingItem}>
            <ThemedText style={styles.settingText}>Dark Mode</ThemedText>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
            />
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});