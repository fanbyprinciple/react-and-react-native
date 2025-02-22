import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, Modal, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ExploreScreen() {
  const [events, setEvents] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);

  const generateMonthsArray = () => {
    const months = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    for (let month = 0; month < 12; month++) {
      months.push(new Date(currentYear, month, 1));
    }
    return months;
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const storedEvents = await AsyncStorage.getItem('calendarEvents');
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        setEvents(parsedEvents);
        
        const marked = {};
        Object.keys(parsedEvents).forEach(date => {
          if (parsedEvents[date].length > 0) {
            marked[date] = {
              marked: true,
              dotColor: '#2196F3',
              selectedColor: '#2196F3',
              selected: true,
              events: parsedEvents[date]
            };
          }
        });
        setMarkedDates(marked);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleDayPress = (day) => {
    if (markedDates[day.dateString]) {
      setSelectedEvents(markedDates[day.dateString].events);
      setModalVisible(true);
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
              selectedDayBackgroundColor: '#2196F3',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#2196F3',
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
    </ScrollView>
  );
}

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
});