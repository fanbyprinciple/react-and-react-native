import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveCycleStartDate = async (date) => {
  await AsyncStorage.setItem('cycleStartDate', date.toISOString());
};

export const getCycleStartDate = async () => {
  const date = await AsyncStorage.getItem('cycleStartDate');
  return date ? new Date(date) : null;
};