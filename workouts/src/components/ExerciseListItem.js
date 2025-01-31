

import { StyleSheet, Text, View } from 'react-native';



export default function ExerciseListItem({item}){
    return(
      <View style={styles.excerciseContainer}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.exerciseSubtitle}>{item.muscle.toUpperCase()} | {item.equipment.toUpperCase()}</Text>
              
      </View>
    )
  }

  const styles = StyleSheet.create({

    excerciseContainer:{
      padding:10,   
      borderRadius:10,  
      gap:5 ,
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
  