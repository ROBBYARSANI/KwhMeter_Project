import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Try to import notifications, but handle if it's not available (Expo Go limitation)
let Notifications = null;
if (Constants.appOwnership !== 'expo') {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    console.warn('expo-notifications not available, geofence notifications will only be logged');
  }
} else {
  console.log('Running in Expo Go, expo-notifications not supported for geofencing push notifications');
}

// Task name for the geofencing background task
export const GEOFENCING_TASK = 'GEOFENCING_TASK';

// Variables to track state
let lastNotificationTime = 0;
let isCurrentlyOutsideGeofence = false;
let notificationIntervalId = null;

// General utility function to send notification or add to list
async function sendGeofenceNotification(title, body) {
  try {
    // Check if phone notifications are enabled
    const phoneNotificationsEnabled = await AsyncStorage.getItem('phoneNotifications');
    const notificationsEnabled = phoneNotificationsEnabled !== 'false'; // Default to true if not set

    // Always add to notification list for logging
    const storedNotifications = await AsyncStorage.getItem('geofence_notifications');
    const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
    notifications.unshift({
      id: Date.now(),
      title,
      description: body,
      type: 'warning',
      timestamp: new Date(),
      isRead: false,
    });
    await AsyncStorage.setItem('geofence_notifications', JSON.stringify(notifications.slice(0, 100))); // Keep only last 100

    // Try to send push notification if enabled and available
    if (notificationsEnabled && Notifications) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: 'default',
            priority: 'high',
          },
          trigger: null, // Send immediately
        });
      } catch (notificationError) {
        console.warn('Failed to send push notification:', notificationError.message);
      }
    }
  } catch (error) {
    console.error('Error sending geofence notification:', error);
  }
}

// Function to start periodic notifications when outside geofence
function startPeriodicNotifications() {
  if (notificationIntervalId) {
    clearInterval(notificationIntervalId);
  }

  notificationIntervalId = setInterval(async () => {
    const currentTime = Date.now();
    const geofenceData = await AsyncStorage.getItem('geofence');

    if (geofenceData) {
      const geofence = JSON.parse(geofenceData);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const isOutside = !isInsideGeofence(location.coords, geofence);

      if (isOutside && !isCurrentlyOutsideGeofence) {
        isCurrentlyOutsideGeofence = true;
        lastNotificationTime = currentTime;
        await sendGeofenceNotification(
          'Peringatan Geofencing',
          'Anda berada diluar area yang ditentukan pada meter'
        );
      } else if (isOutside && currentTime - lastNotificationTime >= 2 * 60 * 60 * 1000) { // 2 hours in milliseconds
        lastNotificationTime = currentTime;
        await sendGeofenceNotification(
          'Peringatan Periodik',
          'Anda masih berada diluar area yang ditentukan pada meter'
        );
      } else if (!isOutside) {
        isCurrentlyOutsideGeofence = false;
        clearInterval(notificationIntervalId);
        notificationIntervalId = null;

        // Send notification that user has returned
        await sendGeofenceNotification(
          'Informasi',
          'Anda telah kembali ke dalam area yang ditentukan'
        );
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
}

// Function to calculate distance between two coordinates
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d * 1000; // Convert to meters
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Function to check if coordinates are inside geofence
function isInsideGeofence(currentLocation, geofence) {
  if (!geofence || !currentLocation) return true;

  const distance = getDistanceFromLatLonInKm(
    currentLocation.latitude,
    currentLocation.longitude,
    geofence.coordinate.latitude,
    geofence.coordinate.longitude
  );

  return distance <= geofence.radius;
}

// Background task definition
TaskManager.defineTask(GEOFENCING_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Geofencing task error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    const currentLocation = locations[0];

    if (currentLocation) {
      // Check geofence settings
      const geofenceData = await AsyncStorage.getItem('geofence');

      if (geofenceData) {
        const geofence = JSON.parse(geofenceData);
        const isOutside = !isInsideGeofence(currentLocation.coords, geofence);

        const currentTime = Date.now();

        if (isOutside && !isCurrentlyOutsideGeofence) {
          // Just entered outside geofence
          isCurrentlyOutsideGeofence = true;
          lastNotificationTime = currentTime;

          await sendGeofenceNotification(
            'Peringatan Geofencing',
            'Anda berada diluar area yang ditentukan pada meter'
          );

          // Start periodic notifications
          startPeriodicNotifications();

        } else if (isOutside && currentTime - lastNotificationTime >= 2 * 60 * 60 * 1000) { // 2 hours
          lastNotificationTime = currentTime;

          await sendGeofenceNotification(
            'Peringatan Periodik',
            'Anda masih berada diluar area yang ditentukan pada meter'
          );
        } else if (!isOutside && isCurrentlyOutsideGeofence) {
          // Just entered inside geofence
          isCurrentlyOutsideGeofence = false;

          if (notificationIntervalId) {
            clearInterval(notificationIntervalId);
            notificationIntervalId = null;
          }

          await sendGeofenceNotification(
            'Informasi',
            'Anda telah kembali ke dalam area yang ditentukan'
          );
        }
      }
    }
  }
});

// Function to start geofencing monitoring
export async function startGeofencingMonitoring() {
  try {
    const geofenceData = await AsyncStorage.getItem('geofence');

    if (!geofenceData) {
      console.log('No geofence data found');
      return;
    }

    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

    if (foregroundStatus !== 'granted' || backgroundStatus !== 'granted') {
      console.log('Location permissions not granted');
      return;
    }

    await Location.startLocationUpdatesAsync(GEOFENCING_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5 * 60 * 1000, // 5 minutes
      distanceInterval: 50, // 50 meters
      showsBackgroundLocationIndicator: true,
    });

    console.log('Geofencing monitoring started');
  } catch (error) {
    console.error('Error starting geofencing monitoring:', error);
  }
}

// Function to stop geofencing monitoring
export async function stopGeofencingMonitoring() {
  try {
    if (notificationIntervalId) {
      clearInterval(notificationIntervalId);
      notificationIntervalId = null;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(GEOFENCING_TASK);
    }

    isCurrentlyOutsideGeofence = false;
    console.log('Geofencing monitoring stopped');
  } catch (error) {
    console.error('Error stopping geofencing monitoring:', error);
  }
}
