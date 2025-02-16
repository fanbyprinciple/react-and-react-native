import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { globalStyles } from '../styles/globalStyles';

const CycleCard = ({ cycleStartDate }) => {
  return (
    <View style={styles.card}>
      <Text style={globalStyles.text}>
        Last cycle started on: {cycleStartDate.toDateString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
});

export default CycleCard;