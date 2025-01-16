import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import exercises from './assets/exercises.json'

export default function App() {
  const exercise = exercises[0]
  
  return (
    <View style={styles.container}>
      <View style={styles.excerciseContainer}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseSubtitle}>{exercise.muscle.toUpperCase()} | {exercise.equipment.toUpperCase()}</Text>
        <StatusBar style="auto" />
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:'gainsboro',
    justifyContent:'center',
    padding:10,

  },
  excerciseContainer:{
    padding:10,
    borderRadius:10,  
    gap:5,
    backgroundColor:'#fff'
  },
  exerciseName: {
    fontWeight: '500',
    fontSize: 20,
     
   
  },
  exerciseSubtitle: {
    color: 'dimgrey'
  }
});
