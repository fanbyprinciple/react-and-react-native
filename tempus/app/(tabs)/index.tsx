import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Agenda } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MyCalendar = () => {
  const [items, setItems] = useState({});
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [newEvent, setNewEvent] = useState({ name: '', time: '' });

  const customTheme = {
    agendaDayTextColor: '#2d4150',
    agendaDayNumColor: '#2d4150',
    agendaTodayColor: '#2196F3',
    agendaKnobColor: '#2196F3',
    backgroundColor: '#ffffff',
    calendarBackground: '#ffffff',
    textSectionTitleColor: '#b6c1cd',
    selectedDayBackgroundColor: '#2196F3',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#2196F3',
    dayTextColor: '#2d4150',
  };

  // Load events from storage when component mounts
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const storedEvents = await AsyncStorage.getItem('calendarEvents');
      if (storedEvents) {
        setItems(JSON.parse(storedEvents));
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const saveEvents = async (newItems) => {
    try {
      await AsyncStorage.setItem('calendarEvents', JSON.stringify(newItems));
    } catch (error) {
      console.error('Error saving events:', error);
    }
  };

  const handleAddEvent = () => {
    if (newEvent.name && newEvent.time) {
      const updatedItems = {
        ...items,
        [selectedDate]: [...(items[selectedDate] || []), newEvent]
      };
      setItems(updatedItems);
      saveEvents(updatedItems);
      setModalVisible(false);
      setNewEvent({ name: '', time: '' });
    }
  };

  const loadItemsForMonth = (month) => {
    const newItems = { ...items };
    const startDate = new Date(month.dateString);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      if (!newItems[dateString]) {
        newItems[dateString] = [];
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setItems(newItems);
  };

  return (
    <View style={styles.container}>
      <Agenda
        items={items}
        selected={new Date().toISOString().split('T')[0]}
        theme={customTheme}
        loadItemsForMonth={loadItemsForMonth}
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
          setModalVisible(true);
        }}
        renderItem={(item) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemTime}>{item.time}</Text>
          </View>
        )}
        renderEmptyDate={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No events for this day</Text>
          </View>
        )}
      />

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Event</Text>
            <TextInput
              style={styles.input}
              placeholder="Event Name"
              value={newEvent.name}
              onChangeText={(text) => setNewEvent({ ...newEvent, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Event Time (e.g., 10:00 AM)"
              value={newEvent.time}
              onChangeText={(text) => setNewEvent({ ...newEvent, time: text })}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleAddEvent}>
                <Text style={styles.buttonText}>Add Event</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  itemContainer: {
    marginVertical: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  itemTime: {
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    marginVertical: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    width: '40%',
  },
  cancelButton: {
    backgroundColor: '#FF0000',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default MyCalendar;