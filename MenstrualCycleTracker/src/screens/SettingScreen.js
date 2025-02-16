import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await AsyncStorage.getItem('notificationSettings');
      if (settings) {
        setNotificationsEnabled(JSON.parse(settings));
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async (value) => {
    await AsyncStorage.setItem('notificationSettings', JSON.stringify(value));
    setNotificationsEnabled(value);
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Settings</Text>
      <View style={styles.settingItem}>
        <Text style={globalStyles.text}>Enable Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={saveSettings}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});

export default SettingsScreen;