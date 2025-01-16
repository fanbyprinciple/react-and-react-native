import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import exercises from './assets/exercises.json'

export default function App() {
  const exercise = exercises[0]
  
  return (
    <View >
      <Text style={styles.exerciseName}>{exercise.name}</Text>
      <Text style={styles.exerciseSubtitle}>{exercise.name}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    alignContent:'center',
    alignItems:'center',
  },
  exerciseName: {
    fontSize: '500'
  },
  exerciseSubtitle: {
    color: 'dimgrey'
  }
});
