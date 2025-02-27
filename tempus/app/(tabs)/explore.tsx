import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ExploreScreen() {
  const [events, setEvents] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isAddEventModalVisible, setAddEventModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [newEvent, setNewEvent] = useState({ name: '', time: '' });

  const generateMonthsArray = () => {
    const months = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    for (let month = 0; month < 12; month++) {
      months.push(new Date(currentYear, month, 1));
    }
    return months;
  };

  // Modify handleDayPress to handle both viewing and adding events
  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
    if (markedDates[day.dateString]) {
      setSelectedEvents(markedDates[day.dateString].events);
      setModalVisible(true);
    } else {
      setAddEventModalVisible(true);
    }
  };

  // Add handleAddEvent function
  const handleAddEvent = async () => {
    if (newEvent.name && newEvent.time) {
      const updatedEvents = {
        ...events,
        [selectedDate]: [...(events[selectedDate] || []), newEvent]
      };
      
      try {
        await AsyncStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
        await loadEvents(); // Reload all events
        setAddEventModalVisible(false);
        setNewEvent({ name: '', time: '' });
      } catch (error) {
        console.error('Error saving event:', error);
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      {generateMonthsArray().map((date, index) => (
        <View key={index} style={styles.monthContainer}>
          <Text style={styles.monthTitle}>
            {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <Calendar
            current={date.toISOString()}
            markedDates={markedDates}
            hideArrows={true}
            hideExtraDays={false}
            disableMonthChange={true}
            firstDay={1}
            hideDayNames={false}
            showWeekNumbers={false}
            disableArrowLeft={true}
            disableArrowRight={true}
            onDayPress={handleDayPress}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: '#FF69B4',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#FF69B4',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              monthTextColor: '#2d4150',
            }}
          />
        </View>
      ))}

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Events</Text>
            {selectedEvents.map((event, index) => (
              <View key={index} style={styles.eventItem}>
                <Text style={styles.eventName}>{event.name}</Text>
                <Text style={styles.eventTime}>{event.time}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add New Event Modal */}
      <Modal
        visible={isAddEventModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddEventModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddEventModalVisible(false)}
        >
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
                onPress={() => setAddEventModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

// Add new styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  monthContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#2d4150',
  },
  dayContainer: {
    alignItems: 'center',
    padding: 5,
  },
  dayText: {
    fontSize: 16,
    color: '#2d4150',
  },
  eventCount: {
    fontSize: 10,
    color: '#2196F3',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2d4150',
    textAlign: 'center',
  },
  eventItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    padding: 10,
    marginBottom: 8,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
    backgroundColor: '#FF69B4',
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