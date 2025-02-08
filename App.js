import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';
import WeeklyCalendar from './src/components/calendar-strip';
import WorkoutCard from './src/components/workout-card';
import { initDatabase } from './src/db/db';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initDatabase();
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    setupDatabase();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingTop: 50 }}>
          <WeeklyCalendar onDateSelect={setSelectedDate} />
        </View>
        <WorkoutCard date={selectedDate} />
      </View>
    </TouchableWithoutFeedback>
  );
}