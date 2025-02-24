import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';
import { WorkoutProvider } from './src/context/workoutcontext';
import WeeklyCalendar from './src/components/calendar-strip';
import WorkoutCard from './src/components/workout-card';
import Journal from './src/components/journal';
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
    <WorkoutProvider>
      <View 
        style={{ flex: 1, backgroundColor: '#000' }}
        onStartShouldSetResponder={() => {
          Keyboard.dismiss();
          return false;
        }}
        onMoveShouldSetResponder={() => false}
      >
        <View style={{ paddingTop: 50 }}>
          <WeeklyCalendar onDateSelect={setSelectedDate} />
        </View>
        <WorkoutCard date={selectedDate} />
        <Journal date={selectedDate} />
      </View>
    </WorkoutProvider>
  );
}