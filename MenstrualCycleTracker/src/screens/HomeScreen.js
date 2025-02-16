import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { useCycleData } from '../hooks/useCycleData';
import { saveCycleStartDate } from '../services/storage';
import CycleCard from '../components/CycleCard';

const HomeScreen = ({ navigation }) => {
  const { cycleStartDate, setCycleStartDate } = useCycleData();

  const logCycleStart = async () => {
    const today = new Date();
    await saveCycleStartDate(today);
    setCycleStartDate(today);
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Menstrual Cycle Tracker</Text>
      {cycleStartDate ? (
        <CycleCard cycleStartDate={cycleStartDate} />
      ) : (
        <Text style={globalStyles.text}>No cycle data recorded yet.</Text>
      )}
      <Button title="Log Cycle Start" onPress={logCycleStart} />
      <Button
        title="View Calendar"
        onPress={() => navigation.navigate('Calendar')}
      />
      <Button
        title="Settings"
        onPress={() => navigation.navigate('Settings')}
      />
    </View>
  );
};

export default HomeScreen;