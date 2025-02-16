import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { globalStyles } from '../styles/globalStyles';
import { useCycleData } from '../hooks/useCycleData';
import { formatDate, addDays } from '../utils/dateUtils';

const CalendarScreen = () => {
  const { cycleStartDate } = useCycleData();
  const [markedDates, setMarkedDates] = useState({});

  useEffect(() => {
    if (cycleStartDate) {
      const marked = {};
      for (let i = 0; i < 5; i++) {
        const date = addDays(cycleStartDate, i);
        marked[formatDate(date)] = { marked: true, dotColor: 'red' };
      }
      setMarkedDates(marked);
    }
  }, [cycleStartDate]);

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Cycle Calendar</Text>
      <Calendar markedDates={markedDates} markingType="period" />
    </View>
  );
};

export default CalendarScreen;