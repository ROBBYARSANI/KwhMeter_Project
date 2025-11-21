import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useMaxKwh() {
  const [maxKwh, setMaxKwh] = useState(3);
  const [isLoading, setIsLoading] = useState(true);

  const loadMaxKwh = async () => {
    try {
      const val = await AsyncStorage.getItem('maxKwh');
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        setMaxKwh(num);
      }
    } catch (error) {
      console.error('Error loading max kWh:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMaxKwh = async (value) => {
    try {
      await AsyncStorage.setItem('maxKwh', value.toString());
      setMaxKwh(parseFloat(value));
      console.log('Max kWh updated:', value);
    } catch (error) {
      console.error('Error saving max kWh:', error);
    }
  };

  useEffect(() => {
    loadMaxKwh();
    
    // Listen for storage changes
    const interval = setInterval(loadMaxKwh, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { maxKwh, saveMaxKwh, isLoading };
}
