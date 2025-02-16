import { StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: colors.text,
  },
});