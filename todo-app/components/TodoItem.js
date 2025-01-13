// components/TodoItem.js
import React from 'react';
import { View, Text, item, TouchableOpacity } from 'react-native';
import styles from './styles'; // Import the styles
import CheckBox from '@react-native-community/checkbox';

export default function TodoItem({ task, deleteTask, toggleCompleted }) {
  return (
    <View style={styles.todo-item}>
      <CheckBox
        value={task.completed}
        onValueChange={() => toggleCompleted(task.id)}
      />
      <Text style={[styles.todo-item-text, task.completed && styles.completed]}>
        {task.text}
      </Text>
      <TouchableOpacity
        style={styles.delete-button}
        onPress={() => deleteTask(task.id)}
      >
        <Text style={{ color: '#fff' }}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}