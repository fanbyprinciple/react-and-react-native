import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Agenda } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const [items, setItems] = useState({});
  const [newEvent, setNewEvent] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadStoredItems();
  }, []);

  const loadStoredItems = async () => {
    try {
      const storedItems = await AsyncStorage.getItem('calendarItems');
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  };

  const saveItems = async (updatedItems) => {
    try {
      await AsyncStorage.setItem('calendarItems', JSON.stringify(updatedItems));
    } catch (error) {
      console.error('Failed to save items:', error);
    }
  };
  //hih

  const addEvent = () => {
    if (!newEvent.trim()) {
      Alert.alert('Enter an event name!');
      return;
    }

    const updatedItems = { ...items };
    if (!updatedItems[selectedDate]) {
      updatedItems[selectedDate] = [];
    }

    updatedItems[selectedDate].push({ name: newEvent, time: 'All Day' });
    setItems(updatedItems);
    saveItems(updatedItems);
    setNewEvent('');
  };

  const loadItemsForMonth = () => {
    const updatedItems = { ...items };

    for (let i = -15; i < 15; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const strDate = date.toISOString().split('T')[0];

      if (!updatedItems[strDate]) {
        updatedItems[strDate] = []; // Ensure empty days are initialized
      }
    }

    setItems(updatedItems);
  };

  return (
    <View style={styles.container}>
      {/* Title Bar */}
      <View style={styles.titleBar}>
        <Text style={styles.titleText}>Perdio</Text>
      </View>

      {/* Calendar Component */}
      <View style={styles.agendaContainer}>
        <Agenda
          items={items}
          selected={selectedDate}
          loadItemsForMonth={loadItemsForMonth}
          renderItem={(item) => (
            <View style={styles.eventItem}>
              <Text style={styles.eventTitle}>{item.name}</Text>
              <Text style={styles.eventTime}>{item.time}</Text>
            </View>
          )}
          renderEmptyDate={() => (
            <View style={styles.emptyDate}>
              <Text style={styles.emptyText}>No events today</Text>
            </View>
          )}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          showClosingKnob={true}
          pastScrollRange={12}
          futureScrollRange={12}
        />
      </View>

      {/* Input Section for Adding New Events */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add an event..."
          value={newEvent}
          onChangeText={setNewEvent}
        />
        <TouchableOpacity onPress={addEvent} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleBar: {
    height: 100,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },
  agendaContainer: {
    flex: 1, // Takes full remaining space
    marginTop: -20, // Pulls the agenda up slightly for better visibility
  },
  eventItem: {
    backgroundColor: 'white',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  eventTitle: {
    fontWeight: 'bold',
  },
  eventTime: {
    color: 'gray',
  },
  emptyDate: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  emptyText: {
    color: 'gray',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  addButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default App;
