import { Image,  Platform } from 'react-native';

import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { StatusBar } from 'expo-status-bar';
import AppContainer from '@/components/app-container';

export default function HomeScreen() {
  return (
    <AppContainer>
    <View style={styles.titleContainer}>
      <Text>Hello World</Text>
      <StatusBar style="auto" />
    </View>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
