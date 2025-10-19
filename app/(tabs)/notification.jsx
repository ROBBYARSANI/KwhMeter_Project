import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

import { useState } from 'react';
import { useThemeMode } from '../../components/theme-context';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function NotificationScreen() {

// Komponen Notification Card dengan Ikon
const NotificationCard = ({ title, value, description, type, isRead, onPress, cardBackground, textColor }) => {
  const getIconName = () => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      case 'energy':
        return 'flash';
      default:
        return 'notifications';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'warning':
        return '#FFA726';
      case 'info':
        return '#42A5F5';
      case 'energy':
        return '#4CAF50';
      default:
        return '#888';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.notificationCardTouchable}>
      <ThemedView style={[
        styles.notificationCard,
        !isRead && styles.unreadNotification,
        { borderLeftColor: getIconColor(), backgroundColor: cardBackground }
      ]}>
        <View style={styles.notificationHeader}>
          <View style={styles.titleContainer}>
            <Ionicons 
              name={getIconName()} 
              size={20} 
              color={getIconColor()} 
              style={styles.icon}
            />
            <ThemedText type="subtitle" style={[styles.notificationTitle, { color: textColor }] }>
              {title}
            </ThemedText>
            {!isRead && <View style={styles.unreadDot} />}
          </View>
          <ThemedText type="title" style={[styles.notificationValue, { color: getIconColor() }] }>
            {value}
          </ThemedText>
        </View>
        <ThemedText style={[styles.notificationDescription, { color: textColor }] }>
          {description}
        </ThemedText>
        <ThemedText style={[styles.notificationTime, { color: textColor }] }>
          2 hours ago
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
};

  const { darkModeEnabled } = useThemeMode();
  const backgroundColor = darkModeEnabled ? '#1a1a1a' : '#f5f5f5';
  const cardBackground = darkModeEnabled ? '#232323' : '#ffffff';
  const textColor = darkModeEnabled ? '#fafafa' : '#232323';
  // Data notifikasi dengan tipe dan status - memperbaiki ID yang duplikat
  const notifications = [
    {
      id: 1,
      title: "Pemakaian Listrik",
      value: "900KWh",
      description: "Pemakaian listrik anda melebihi batas pemakaian harian.",
      type: "warning",
      isRead: false,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: 2,
      title: "Listrik Menyala",
      value: "90",
      description: "Listrik anda masih menyala saat meninggalkan tempat tinggal.",
      type: "energy",
      isRead: true,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
    },
    {
      id: 3,
      title: "Tips Hemat Energi",
      value: "15%",
      description: "Anda bisa menghemat hingga 15% dengan mematikan perangkat standby.",
      type: "info",
      isRead: true,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      id: 4,
      title: "Pembayaran Berhasil",
      value: "Rp 250.000",
      description: "Pembayaran listrik bulan ini telah berhasil diproses.",
      type: "info",
      isRead: true,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
      id: 5,
      title: "Penggunaan Puncak",
      value: "1.2MWh",
      description: "Penggunaan listrik mencapai puncak pada jam 18:00-20:00.",
      type: "warning",
      isRead: false,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    }
  ];

  const handleNotificationPress = (notificationId) => {
    console.log('Notification pressed:', notificationId);
    // Handle notification press (mark as read, navigate, etc.)
  };

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  return (
    <View style={[styles.mainContainer, { backgroundColor }] }>
      {/* Header dengan jumlah notifikasi belum dibaca - TETAP */}
      <View style={[styles.header, { backgroundColor }] }>
        <ThemedText type="title" style={[styles.headerTitle, { color: textColor }] }>
          Notifications
        </ThemedText>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
          </View>
        )}
      </View>

      {/* Notifications List dan Clear All Button - BISA DI-SCROLL */}
      <ScrollView 
        style={[styles.scrollContainer, { backgroundColor } ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Daftar Notifikasi */}
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            title={notification.title}
            value={notification.value}
            description={notification.description}
            type={notification.type}
            isRead={notification.isRead}
            onPress={() => handleNotificationPress(notification.id)}
            cardBackground={cardBackground}
            textColor={textColor}
          />
        ))}
        
        {/* Tombol Clear All - sekarang ikut di-scroll */}
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.clearAllButton}>
            <ThemedText style={styles.clearAllText}>Clear All Notifications</ThemedText>
          </TouchableOpacity>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  notificationCardTouchable: {
    marginBottom: 12,
  },
  notificationCard: {
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
  },
  unreadNotification: {
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  icon: {
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    marginLeft: 8,
  },
  notificationValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  clearAllButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  clearAllText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
});