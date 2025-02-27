import { Tabs } from 'expo-router';
import React from 'react';

import { IconSymbol } from '@/components/ui/IconSymbol';

import { useColorScheme } from '@/hooks/useColorScheme';
import { View, Text, StyleSheet } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TEMPUS</Text>
      </View>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#FF69B4',
          tabBarStyle: {
            backgroundColor: '#ffffff',
          }
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Weekly View',
            tabBarIcon: ({ color }) => <IconSymbol name="calendar" color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Year View',
            tabBarIcon: ({ color }) => <IconSymbol name="calendar.circle" color={color} size={24} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FF69B4',
    paddingTop: 40,
    paddingBottom: 10,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
