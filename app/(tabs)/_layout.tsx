// Simple notifications context
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useState, useContext, createContext } from 'react';
import { Platform } from 'react-native';

type NotificationType = {
  id: number;
  timestamp: Date;
  isRead: boolean;
  [key: string]: any; // Allow additional properties
};

type NotificationsContextType = {
  notifications: NotificationType[];
  addNotification: (notification: { [key: string]: any }) => void;
  markAsRead: (id: number) => void;
  clearAllNotifications: () => void;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

export default function TabLayout() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  const addNotification = (notification: { [key: string]: any }) => {
    const newNotification: NotificationType = {
      id: Date.now(),
      ...notification,
      timestamp: new Date(),
      isRead: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, markAsRead, clearAllNotifications }}>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#2a2a2a',
          borderTopColor: '#333',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -1 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              color={color} 
              size={24} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notifikasi',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'notifications' : 'notifications-outline'} 
              color={color} 
              size={24} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Pengaturan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'settings' : 'settings-outline'} 
              color={color} 
              size={24} 
            />
          ),
        }}
      />
    </Tabs>
    </NotificationsContext.Provider>
  );
}
