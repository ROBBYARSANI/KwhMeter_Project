import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

import { useState, useRef } from 'react';
import { Animated, LayoutAnimation, UIManager, Platform } from 'react-native';
import { useThemeMode } from '../../components/theme-context';
import { useNotifications } from './_layout';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface NotificationCardProps {
  title: string;
  value: string;
  description: string;
  type: string;
  isRead: boolean;
  onPress: () => void;
  cardBackground: string;
  textColor: string;
  timestamp: Date;
  animatedValue?: Animated.Value;
}

export default function NotificationScreen() {
  const { notifications, markAsRead, clearAllNotifications } = useNotifications();

  const allNotifications = [...notifications];

  // Animation setup
  if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  // Create animated values for each notification
  const animatedValues = useRef<Animated.Value[]>([]);
  if (animatedValues.current.length !== allNotifications.length) {
    animatedValues.current = allNotifications.map(() => new Animated.Value(0));
  }

  const animateClearNotifications = () => {
    // Configure layout animation for smooth removal
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

    // Animate from bottom to top with stagger
    const animations = allNotifications.map((_, index) => {
      const reverseIndex = allNotifications.length - 1 - index; // Start from bottom
      return Animated.timing(animatedValues.current[index], {
        toValue: 1,
        duration: 300,
        delay: reverseIndex * 100, // Stagger animation
        useNativeDriver: true,
      });
    });

    Animated.stagger(50, animations).start(() => {
      // Clear notifications after animation completes
      clearAllNotifications();
      // Reset animations
      animatedValues.current.forEach(anim => anim.setValue(0));
    });
  };

// Komponen Notification Card dengan Ikon
const NotificationCard = ({ title, value, description, type, isRead, onPress, cardBackground, textColor, timestamp, animatedValue }: NotificationCardProps) => {
  const animVal = animatedValue || new Animated.Value(0);
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

  const translateX = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -400], // Move 400px to the left
  });

  const opacity = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <Animated.View
      style={{
        transform: [{ translateX }],
        opacity,
        marginBottom: 12,
      }}
    >
      <TouchableOpacity onPress={onPress}>
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
          {getTimeAgo(timestamp)}
        </ThemedText>
        </ThemedView>
      </TouchableOpacity>
    </Animated.View>
  );
};

  const { darkModeEnabled } = useThemeMode();
  const backgroundColor = darkModeEnabled ? '#1a1a1a' : '#f5f5f5';
  const cardBackground = darkModeEnabled ? '#232323' : '#ffffff';
  const textColor = darkModeEnabled ? '#fafafa' : '#232323';

  const handleNotificationPress = (notificationId: unknown) => {
    console.log('Notification pressed:', notificationId);
    // Handle notification press (mark as read, navigate, etc.)
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  const unreadCount = allNotifications.filter(notification => !notification.isRead).length;

  return (
    <View style={[styles.mainContainer, { backgroundColor }] }>
      {/* Header dengan jumlah notifikasi belum dibaca - TETAP */}
      <View style={[styles.header, { backgroundColor }] }>
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
        {allNotifications.map((notification, index) => (
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
            timestamp={notification.timestamp}
            animatedValue={animatedValues.current[index]}
          />
        ))}

        {/* Tombol Clear All - sekarang ikut di-scroll */}
        {allNotifications.length > 0 && (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <TouchableOpacity style={styles.clearAllButton} onPress={animateClearNotifications}>
              <Ionicons name="trash" size={24} color="#636161ff" />
            </TouchableOpacity>
          </View>
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
    width: 48,
    height: 1,
    justifyContent: 'center',
    padding: 16,
    marginTop: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0)',
  },
  clearAllText: {
    color: '#7c7a7aff',
    fontWeight: '600',
  },
});
