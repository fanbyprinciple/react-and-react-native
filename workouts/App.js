import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import exercises from './assets/exercises.json'
import { FlatList } from 'react-native-web';
import ExerciseListItem from './src/components/ExerciseListItem';

export default function App() {
  const exercise = exercises[0]
  
  return (
    <View style={styles.container}>

      <FlatList 
      data={exercises} 
      currentContainerStyle={{gap:10}}
      renderItem={({item}) => (
         <ExerciseListItem item={item}/>
     
        )
      }/>
      <StatusBar style="auto" /> 
      
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:'gainsboro',
    justifyContent:'center',
    padding:10,
    paddingTop:70,
  },
});
