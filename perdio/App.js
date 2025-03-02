import React, { useState } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { Agenda } from 'react-native-calendars';
import { calendarTheme } from 'react-native-calendars';

export default function App() {
  const [items, setItems] = useState({
    '2024-04-29': [{ name: 'Meeting with client', time: '10:00 AM' }],
    '2024-04-30': [{ name: 'Team brainstorming session', time: '9:00 AM' }, { name: 'Project presentation', time: '2:00 PM' }, { name: 'Project presentation', time: '5:00 PM' }],
    '2024-05-01': [{ name: 'Team brainstorming session', time: '9:00 AM' }, { name: 'Project presentation', time: '2:00 PM' }],
    '2024-05-02': [{ name: 'Team brainstorming session', time: '9:00 AM' }, { name: 'Project presentation', time: '2:00 PM' }],
  });

  const customTheme = {
    ...calendarTheme,
    agendaDayTextColor: 'yellow',
    agendaDayNumColor: 'green',
    agendaTodayColor: 'red',
    agendaKnobColor: 'blue'
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <Agenda
          items={items}
          showOnlySelectedDayItems={true}
          theme={customTheme}
          renderItem={(item) => (
            <View style={{ marginVertical: 10, marginTop: 30, backgroundColor: 'white', marginHorizontal: 10, padding: 10 }}>
              <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
              <Text>{item.time}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}