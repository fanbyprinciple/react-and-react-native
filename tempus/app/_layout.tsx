import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

// Interface for marked dates
interface MarkedDates {
  [date: string]: {
    selected: boolean;
    marked: boolean;
    selectedColor: string;
  };
}

// Custom hook to manage marked dates
const useMarkedDates = () => {
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  // Load marked dates from storage on component mount
  useEffect(() => {
    loadMarkedDates();
  }, []);

  // Load marked dates from AsyncStorage
  const loadMarkedDates = async () => {
    try {
      const storedDates = await AsyncStorage.getItem('markedDates');
      if (storedDates) {
        setMarkedDates(JSON.parse(storedDates));
      }
    } catch (error) {
      console.error('Error loading marked dates:', error);
    }
  };

  // Save marked dates to AsyncStorage
  const saveMarkedDates = async (dates: MarkedDates) => {
    try {
      await AsyncStorage.setItem('markedDates', JSON.stringify(dates));
    } catch (error) {
      console.error('Error saving marked dates:', error);
    }
  };

  // Toggle date marking
  const toggleDateMark = (date: string) => {
    const updatedDates = {
      ...markedDates,
      [date]: {
        selected: true,
        marked: true,
        selectedColor: '#50cebb',
      },
    };
    setMarkedDates(updatedDates);
    saveMarkedDates(updatedDates);
  };

  return { markedDates, toggleDateMark };
};
