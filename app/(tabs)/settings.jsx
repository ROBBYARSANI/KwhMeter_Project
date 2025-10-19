
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useState } from 'react';
import { useThemeMode } from '../../components/theme-context';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

export default function SettingsScreen() {


  const [autoManual, setAutoManual] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { darkModeEnabled, setDarkModeEnabled } = useThemeMode();

  // Tentukan warna background dan section berdasarkan darkModeEnabled
  const backgroundColor = darkModeEnabled ? '#1a1a1a' : '#f5f5f5';
  const sectionBackgroundColor = darkModeEnabled ? '#232323' : '#ffffff';
  const sectionTitleColor = darkModeEnabled ? '#e0e0e0' : '#232323';
  const settingItemBackgroundColor = sectionBackgroundColor;
  const settingTextColor = darkModeEnabled ? '#fafafa' : '#232323';

  return (
    <View style={[styles.mainContainer, { backgroundColor: backgroundColor}]}> 
      {/* Header */}
      <View style={[styles.header, { backgroundColor: backgroundColor }]}>
        <ThemedText type="title" style={[styles.headerTitle, { color: settingTextColor }]}>
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
        <ThemedView style={[styles.section, { backgroundColor: sectionBackgroundColor }]}> 
          <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>Alarmat</ThemedText>
          <ThemedView style={[styles.settingItem, { backgroundColor: settingItemBackgroundColor }]}> 
            <ThemedText style={[styles.settingText, { color: settingTextColor }]}>aaaaa</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Auto/Manual Section */}
        <ThemedView style={[styles.section, { backgroundColor: sectionBackgroundColor }]}> 
          <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>Operation Mode</ThemedText>
          <ThemedView style={[styles.settingItem, { backgroundColor: settingItemBackgroundColor }]}> 
            <ThemedText style={[styles.settingText, { color: settingTextColor }]}>Auto/Manual</ThemedText>
            <Switch
              value={autoManual}
              onValueChange={setAutoManual}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={autoManual ? '#f4f3f4' : '#f4f3f4'}
            />
          </ThemedView>
        </ThemedView>

        {/* Additional Settings bisa ditambahkan di sini */}
        <ThemedView style={[styles.section, { backgroundColor: sectionBackgroundColor }]}> 
          <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>Preferences</ThemedText>
          <ThemedView style={[styles.settingItem, { backgroundColor: settingItemBackgroundColor }]}> 
            <ThemedText style={[styles.settingText, { color: settingTextColor }]}>Notifications</ThemedText>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
            />
          </ThemedView>
          <ThemedView style={[styles.settingItem, { backgroundColor: settingItemBackgroundColor }]}> 
            <ThemedText style={[styles.settingText, { color: settingTextColor }]}>Dark Mode</ThemedText>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
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